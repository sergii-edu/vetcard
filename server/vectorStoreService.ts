import OpenAI from "openai";
import type { LabTest, HealthMetric } from "@shared/schema";

export class VectorStoreService {
  private openai: OpenAI;

  constructor(openai: OpenAI) {
    this.openai = openai;
  }

  async createVectorStore(animalId: string, animalName: string): Promise<string> {
    try {
      console.log("[VECTOR] Creating vector store for:", animalName);
      
      // vectorStores is at the top level of the OpenAI client, NOT in beta
      const vectorStore = await (this.openai as any).vectorStores.create({
        name: `${animalName} Health Data`,
        metadata: { animalId },
      });
      
      console.log("[VECTOR] ✓ Created vector store:", vectorStore.id);
      return vectorStore.id;
    } catch (error: any) {
      console.error("[VECTOR] ✗ Error creating vector store:", error?.message || error);
      throw new Error(`Failed to create vector store: ${error?.message || 'Unknown error'}`);
    }
  }

  async uploadMetricToVectorStore(
    vectorStoreId: string,
    metricData: {
      metricName: string;
      value: number;
      unit: string;
      recordDate: string;
      referenceMin?: number;
      referenceMax?: number;
      notes?: string;
    }
  ): Promise<string> {
    try {
      console.log("[VECTOR] Uploading metric to vector store:", metricData.metricName);
      const content = this.formatMetricForEmbedding(metricData);
      
      // Convert string content to File object for OpenAI Files API
      const blob = new Blob([content], { type: 'text/plain' });
      const file = new File([blob], `${metricData.metricName}.txt`, { type: 'text/plain' });
      
      const uploadedFile = await this.openai.files.create({
        file: file,
        purpose: 'assistants',
      });
      console.log("[VECTOR] Created file:", uploadedFile.id);
      
      // vectorStores is at the top level, NOT in beta
      await (this.openai as any).vectorStores.files.create(vectorStoreId, {
        file_id: uploadedFile.id,
      });
      
      console.log("[VECTOR] ✓ Uploaded metric to vector store");
      return uploadedFile.id;
    } catch (error: any) {
      console.error("[VECTOR] ✗ Error uploading metric:", error?.message || error);
      throw new Error("Failed to upload metric to vector store");
    }
  }

  async deleteMetricFromVectorStore(
    vectorStoreId: string,
    vectorStoreFileId: string
  ): Promise<void> {
    try {
      console.log("[VECTOR] Deleting metric from vector store:", vectorStoreFileId);
      // vectorStores is at the top level, NOT in beta
      await (this.openai as any).vectorStores.files.delete(vectorStoreId, vectorStoreFileId);
      
      await this.openai.files.delete(vectorStoreFileId);
      console.log("[VECTOR] ✓ Deleted metric from vector store");
    } catch (error: any) {
      console.error("[VECTOR] ✗ Error deleting metric:", error?.message || error);
    }
  }

  async updateMetricInVectorStore(
    vectorStoreId: string,
    oldFileId: string | null,
    metricData: {
      metricName: string;
      value: number;
      unit: string;
      recordDate: string;
      referenceMin?: number;
      referenceMax?: number;
      notes?: string;
    }
  ): Promise<string> {
    if (oldFileId) {
      await this.deleteMetricFromVectorStore(vectorStoreId, oldFileId);
    }
    
    return await this.uploadMetricToVectorStore(vectorStoreId, metricData);
  }

  async uploadLabTestToVectorStore(
    vectorStoreId: string,
    labTest: LabTest,
    metrics: HealthMetric[]
  ): Promise<string> {
    try {
      console.log("[VECTOR] Uploading lab test to vector store:", labTest.id);
      const content = this.formatLabTestForEmbedding(labTest, metrics);
      
      const blob = new Blob([content], { type: 'text/plain' });
      const filename = `lab_test_${labTest.testDate}_${labTest.testType || 'test'}.txt`;
      const file = new File([blob], filename, { type: 'text/plain' });
      
      const uploadedFile = await this.openai.files.create({
        file: file,
        purpose: 'assistants',
      });
      console.log("[VECTOR] Created file:", uploadedFile.id);
      
      await (this.openai as any).vectorStores.files.create(vectorStoreId, {
        file_id: uploadedFile.id,
      });
      
      console.log("[VECTOR] ✓ Uploaded lab test to vector store");
      return uploadedFile.id;
    } catch (error: any) {
      console.error("[VECTOR] ✗ Error uploading lab test:", error?.message || error);
      throw new Error("Failed to upload lab test to vector store");
    }
  }

  async updateLabTestInVectorStore(
    vectorStoreId: string,
    oldFileId: string | null,
    labTest: LabTest,
    metrics: HealthMetric[]
  ): Promise<string> {
    if (oldFileId) {
      await this.deleteMetricFromVectorStore(vectorStoreId, oldFileId);
    }
    
    return await this.uploadLabTestToVectorStore(vectorStoreId, labTest, metrics);
  }

  private formatLabTestForEmbedding(labTest: LabTest, metrics: HealthMetric[]): string {
    let text = `=== LAB TEST ANALYSIS ===\n\n`;
    text += `Test Date: ${labTest.testDate}\n`;
    
    if (labTest.testType) {
      text += `Test Type: ${labTest.testType}\n`;
    }
    
    if (labTest.clinicName) {
      text += `Clinic: ${labTest.clinicName}\n`;
    }
    
    if (labTest.notes) {
      text += `General Notes: ${labTest.notes}\n`;
    }
    
    text += `\n=== METRICS (${metrics.length} total) ===\n\n`;
    
    metrics.forEach((metric, index) => {
      text += `${index + 1}. ${metric.metricName}:\n`;
      text += `   Value: ${metric.value} ${metric.unit}\n`;
      
      if (metric.referenceMin !== null && metric.referenceMax !== null) {
        text += `   Reference Range: ${metric.referenceMin}-${metric.referenceMax} ${metric.unit}\n`;
        
        if (metric.value < metric.referenceMin) {
          text += `   ⚠️ Status: BELOW NORMAL (Low)\n`;
        } else if (metric.value > metric.referenceMax) {
          text += `   ⚠️ Status: ABOVE NORMAL (High)\n`;
        } else {
          text += `   ✓ Status: Within Normal Range\n`;
        }
      }
      
      if (metric.notes) {
        text += `   Notes: ${metric.notes}\n`;
      }
      
      text += `\n`;
    });
    
    // Summary section
    const abnormalMetrics = metrics.filter(m => 
      m.referenceMin !== null && m.referenceMax !== null &&
      (m.value < m.referenceMin || m.value > m.referenceMax)
    );
    
    if (abnormalMetrics.length > 0) {
      text += `=== SUMMARY ===\n`;
      text += `Total abnormal values: ${abnormalMetrics.length} out of ${metrics.length}\n`;
      text += `Abnormal metrics:\n`;
      abnormalMetrics.forEach(m => {
        const status = m.value < (m.referenceMin || 0) ? 'LOW' : 'HIGH';
        text += `  - ${m.metricName}: ${status}\n`;
      });
    }
    
    return text;
  }

  private formatMetricForEmbedding(metric: {
    metricName: string;
    value: number;
    unit: string;
    recordDate: string;
    referenceMin?: number;
    referenceMax?: number;
    notes?: string;
  }): string {
    let text = `Medical metric: ${metric.metricName}\n`;
    text += `Value: ${metric.value} ${metric.unit}\n`;
    text += `Date: ${metric.recordDate}\n`;
    
    if (metric.referenceMin !== undefined && metric.referenceMax !== undefined) {
      text += `Reference range: ${metric.referenceMin}-${metric.referenceMax} ${metric.unit}\n`;
      
      if (metric.value < metric.referenceMin) {
        text += `Status: Below normal range (low)\n`;
      } else if (metric.value > metric.referenceMax) {
        text += `Status: Above normal range (high)\n`;
      } else {
        text += `Status: Within normal range\n`;
      }
    }
    
    if (metric.notes) {
      text += `Notes: ${metric.notes}\n`;
    }
    
    return text;
  }

  async deleteVectorStore(vectorStoreId: string): Promise<void> {
    try {
      console.log("[VECTOR] Deleting vector store:", vectorStoreId);
      
      // Delete the vector store (this also deletes all associated files)
      await (this.openai as any).vectorStores.delete(vectorStoreId);
      
      console.log("[VECTOR] ✓ Deleted vector store");
    } catch (error: any) {
      console.error("[VECTOR] ✗ Error deleting vector store:", error?.message || error);
      throw new Error(`Failed to delete vector store: ${error?.message || 'Unknown error'}`);
    }
  }
}
