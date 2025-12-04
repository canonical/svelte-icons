import { useEffect } from "react";
import type { ThemeName } from "../../theme";
import { CLASS_MAP } from "./constants";

const VanillaFrameworkThemeProvider = ({
  theme,
  children,
}: {
  theme: ThemeName;
  children: React.ReactNode;
}) => {
  useEffect(() => {
    const vanillaClassName = CLASS_MAP[theme];
    document.documentElement.classList.add(vanillaClassName);
    return () => {
      document.documentElement.classList.remove(vanillaClassName);
    };
  }, [theme]);

  return children;
};

export default VanillaFrameworkThemeProvider;
