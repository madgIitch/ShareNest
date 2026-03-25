import { I18n } from "i18n-js";
import * as Localization from "expo-localization";
import { es } from "./es";

const i18n = new I18n({ es });

i18n.locale = Localization.getLocales()[0]?.languageCode ?? "es";
i18n.enableFallback = true;
i18n.defaultLocale = "es";

export default i18n;
export const t = (key: string, options?: object) => i18n.t(key, options);
