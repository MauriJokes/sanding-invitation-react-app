import { useEffect, useState } from "react";

const TEXT_FIELD = "input:not([type=checkbox]):not([type=radio]):not([type=hidden]), textarea";

/** True while a text field has focus (the on-screen keyboard is likely open). */
export function useTextFieldFocus(): boolean {
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    const onIn = (e: FocusEvent) => {
      if (e.target instanceof Element && e.target.matches(TEXT_FIELD)) setFocused(true);
    };
    const onOut = () => setFocused(false);
    document.addEventListener("focusin", onIn);
    document.addEventListener("focusout", onOut);
    return () => {
      document.removeEventListener("focusin", onIn);
      document.removeEventListener("focusout", onOut);
    };
  }, []);
  return focused;
}
