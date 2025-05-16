/**
 * System lokalizacji dla aplikacji CityHooper
 */

// Dostępne języki w aplikacji
export type Language = "pl" | "en";

// Kategorie tłumaczeń w aplikacji
interface TranslationCategories {
  common: {
    loading: string;
    error: string;
    success: string;
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    search: string;
    back: string;
    next: string;
    previous: string;
  };
  auth: {
    signIn: string;
    signUp: string;
    signOut: string;
    passwordReset: string;
    forgotPassword: string;
    email: string;
    password: string;
    confirmPassword: string;
    continueWithGoogle: string;
    orSeparator: string;
    noAccount: string;
    hasAccount: string;
    passwordResetSuccess: string;
    passwordMinLength: string;
    passwordsMustMatch: string;
    updatePassword: string;
    processing: string;
    redirecting: string;
    backToLogin: string;
  };
  projects: {
    myProjects: string;
    newProject: string;
    projectName: string;
    createProject: string;
    editProject: string;
    deleteProject: string;
    deleteProjectConfirmation: string;
    noProjects: string;
    createFirstProject: string;
    projectNamePlaceholder: string;
    projectSettings: string;
    lastUpdated: string;
  };
  notes: {
    notes: string;
    newNote: string;
    noteTitle: string;
    noteContent: string;
    createNote: string;
    editNote: string;
    deleteNote: string;
    deleteNoteConfirmation: string;
    noNotes: string;
    createFirstNote: string;
    noteTitlePlaceholder: string;
    noteContentPlaceholder: string;
    tags: string;
    addTag: string;
    configNote: string;
    arrivalDate: string;
    departureDate: string;
    numDays: string;
    numPeople: string;
  };
  errors: {
    sessionExpired: string;
    unauthorized: string;
    notFound: string;
    serverError: string;
    networkError: string;
    invalidCredentials: string;
    emailAlreadyInUse: string;
    weakPassword: string;
    limitReached: string;
    nameConflict: string;
  };
}

// Wszystkie tłumaczenia
type Translations = Record<Language, TranslationCategories>;

// Tłumaczenia polskie
const pl: TranslationCategories = {
  common: {
    loading: "Ładowanie...",
    error: "Błąd",
    success: "Sukces",
    save: "Zapisz",
    cancel: "Anuluj",
    delete: "Usuń",
    edit: "Edytuj",
    search: "Szukaj",
    back: "Powrót",
    next: "Dalej",
    previous: "Wstecz",
  },
  auth: {
    signIn: "Zaloguj się",
    signUp: "Zarejestruj się",
    signOut: "Wyloguj",
    passwordReset: "Reset hasła",
    forgotPassword: "Zapomniałem hasła",
    email: "Email",
    password: "Hasło",
    confirmPassword: "Potwierdź hasło",
    continueWithGoogle: "Kontynuuj z Google",
    orSeparator: "lub",
    noAccount: "Nie masz konta?",
    hasAccount: "Masz już konto?",
    passwordResetSuccess: "Hasło zostało zmienione pomyślnie",
    passwordMinLength: "Hasło musi mieć co najmniej 6 znaków",
    passwordsMustMatch: "Hasła nie są identyczne",
    updatePassword: "Zmień hasło",
    processing: "Przetwarzanie...",
    redirecting: "Przekierowywanie...",
    backToLogin: "Powrót do logowania",
  },
  projects: {
    myProjects: "Twoje projekty",
    newProject: "Nowy projekt",
    projectName: "Nazwa projektu",
    createProject: "Utwórz projekt",
    editProject: "Edytuj projekt",
    deleteProject: "Usuń projekt",
    deleteProjectConfirmation: "Czy na pewno chcesz usunąć ten projekt? Tej operacji nie można cofnąć.",
    noProjects: "Nie masz jeszcze żadnych projektów",
    createFirstProject: "Utwórz swój pierwszy projekt",
    projectNamePlaceholder: "Wprowadź nazwę projektu",
    projectSettings: "Ustawienia projektu",
    lastUpdated: "Ostatnia aktualizacja",
  },
  notes: {
    notes: "Notatki",
    newNote: "Nowa notatka",
    noteTitle: "Tytuł notatki",
    noteContent: "Treść notatki",
    createNote: "Utwórz notatkę",
    editNote: "Edytuj notatkę",
    deleteNote: "Usuń notatkę",
    deleteNoteConfirmation: "Czy na pewno chcesz usunąć tę notatkę? Tej operacji nie można cofnąć.",
    noNotes: "Nie masz jeszcze żadnych notatek",
    createFirstNote: "Utwórz swoją pierwszą notatkę",
    noteTitlePlaceholder: "Wprowadź tytuł notatki",
    noteContentPlaceholder: "Wprowadź treść notatki",
    tags: "Tagi",
    addTag: "Dodaj tag",
    configNote: "Notatka konfiguracyjna",
    arrivalDate: "Data przyjazdu",
    departureDate: "Data wyjazdu",
    numDays: "Liczba dni",
    numPeople: "Liczba osób",
  },
  errors: {
    sessionExpired: "Twoja sesja wygasła. Zaloguj się ponownie.",
    unauthorized: "Brak autoryzacji do wykonania tej operacji.",
    notFound: "Zasób nie został znaleziony.",
    serverError: "Wystąpił błąd serwera. Spróbuj ponownie później.",
    networkError: "Problem z połączeniem. Sprawdź swoje połączenie z internetem.",
    invalidCredentials: "Nieprawidłowy email lub hasło.",
    emailAlreadyInUse: "Podany adres email jest już używany.",
    weakPassword: "Hasło jest za słabe. Użyj silniejszego hasła.",
    limitReached: "Osiągnięto limit zasobów.",
    nameConflict: "Nazwa już istnieje. Wybierz inną nazwę.",
  },
};

// Tłumaczenia angielskie
const en: TranslationCategories = {
  common: {
    loading: "Loading...",
    error: "Error",
    success: "Success",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    search: "Search",
    back: "Back",
    next: "Next",
    previous: "Previous",
  },
  auth: {
    signIn: "Sign in",
    signUp: "Sign up",
    signOut: "Sign out",
    passwordReset: "Password reset",
    forgotPassword: "Forgot password",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm password",
    continueWithGoogle: "Continue with Google",
    orSeparator: "or",
    noAccount: "Don't have an account?",
    hasAccount: "Already have an account?",
    passwordResetSuccess: "Password has been changed successfully",
    passwordMinLength: "Password must be at least 6 characters long",
    passwordsMustMatch: "Passwords do not match",
    updatePassword: "Update password",
    processing: "Processing...",
    redirecting: "Redirecting...",
    backToLogin: "Back to login",
  },
  projects: {
    myProjects: "Your projects",
    newProject: "New project",
    projectName: "Project name",
    createProject: "Create project",
    editProject: "Edit project",
    deleteProject: "Delete project",
    deleteProjectConfirmation: "Are you sure you want to delete this project? This action cannot be undone.",
    noProjects: "You don't have any projects yet",
    createFirstProject: "Create your first project",
    projectNamePlaceholder: "Enter project name",
    projectSettings: "Project settings",
    lastUpdated: "Last updated",
  },
  notes: {
    notes: "Notes",
    newNote: "New note",
    noteTitle: "Note title",
    noteContent: "Note content",
    createNote: "Create note",
    editNote: "Edit note",
    deleteNote: "Delete note",
    deleteNoteConfirmation: "Are you sure you want to delete this note? This action cannot be undone.",
    noNotes: "You don't have any notes yet",
    createFirstNote: "Create your first note",
    noteTitlePlaceholder: "Enter note title",
    noteContentPlaceholder: "Enter note content",
    tags: "Tags",
    addTag: "Add tag",
    configNote: "Configuration note",
    arrivalDate: "Arrival date",
    departureDate: "Departure date",
    numDays: "Number of days",
    numPeople: "Number of people",
  },
  errors: {
    sessionExpired: "Your session has expired. Please login again.",
    unauthorized: "You are not authorized to perform this action.",
    notFound: "Resource not found.",
    serverError: "Server error occurred. Please try again later.",
    networkError: "Network problem. Please check your internet connection.",
    invalidCredentials: "Invalid email or password.",
    emailAlreadyInUse: "Email address is already in use.",
    weakPassword: "Password is too weak. Please use a stronger password.",
    limitReached: "Resource limit reached.",
    nameConflict: "Name already exists. Please choose another name.",
  },
};

// Wszystkie tłumaczenia
export const translations: Translations = {
  pl,
  en,
};

// Domyślny język aplikacji
export const defaultLanguage: Language = "pl";

// Pobieranie tłumaczenia
export function getTranslation(
  language: Language = defaultLanguage,
  category: keyof TranslationCategories,
  key: string
): string {
  const translationCategory = translations[language][category] as Record<string, string>;
  return translationCategory[key] || `Missing translation: ${category}.${key}`;
}

// Hook useTranslation
export function createTranslationService(language: Language = defaultLanguage) {
  return {
    t: (category: keyof TranslationCategories, key: string): string => getTranslation(language, category, key),
    language,
  };
}

// Domyślna instancja serwisu tłumaczeń
export const i18n = createTranslationService();

// Wykorzystanie:
// import { i18n } from "@/lib/i18n/translations";
// const text = i18n.t("auth", "signIn"); // "Zaloguj się"
