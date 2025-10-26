import { AlertBanner } from "../AlertBanner";

export default function AlertBannerExample() {
  return (
    <div className="space-y-4 max-w-2xl">
      <AlertBanner
        type="error"
        title="Критичне відхилення показників"
        message="Рівень гемоглобіну нижче норми. Рекомендується негайна консультація ветеринара."
        onDismiss={() => console.log("Alert dismissed")}
      />
      <AlertBanner
        type="warning"
        title="Показник поза нормою"
        message="Рівень глюкози трохи підвищений. Слідкуйте за станом тварини."
        onDismiss={() => console.log("Alert dismissed")}
      />
      <AlertBanner
        type="info"
        title="Нагадування про вакцинацію"
        message="Через 7 днів потрібна ревакцинація проти сказу."
      />
    </div>
  );
}
