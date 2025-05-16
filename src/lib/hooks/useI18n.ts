import { useState } from "react";
import { Language, createTranslationService, defaultLanguage } from "../i18n/translations";

/**
 * Hook do obsługi tłumaczeń w komponentach React
 * @param initialLanguage Początkowy język (domyślnie z ustawień systemu lub pl)
 * @returns Obiekt z funkcją tłumaczenia i funkcją zmiany języka
 */
export function useI18n(initialLanguage?: Language) {
  // Określenie początkowego języka (preferowany z localStorage lub defaultLanguage)
  const getBrowserLanguage = (): Language => {
    // Pobierz zapisany język z localStorage
    const savedLanguage =
      typeof localStorage !== "undefined" ? (localStorage.getItem("app-language") as Language | null) : null;

    if (savedLanguage && (savedLanguage === "pl" || savedLanguage === "en")) {
      return savedLanguage;
    }

    // Albo z ustawień przeglądarki
    const browserLang = typeof navigator !== "undefined" ? navigator.language.split("-")[0] : null;

    return browserLang === "pl" || browserLang === "en" ? (browserLang as Language) : defaultLanguage;
  };

  // Ustawienie początkowego języka
  const [language, setLanguage] = useState<Language>(initialLanguage || getBrowserLanguage());

  // Serwis tłumaczeń dla bieżącego języka
  const translationService = createTranslationService(language);

  // Funkcja zmiany języka
  const changeLanguage = (newLanguage: Language) => {
    setLanguage(newLanguage);
    // Zapisz wybór w localStorage
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("app-language", newLanguage);
    }
  };

  return {
    t: translationService.t,
    language,
    changeLanguage,
  };
}
