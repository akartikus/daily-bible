import { cleanup, fireEvent, render, screen } from "@testing-library/svelte";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createChromeMock, type ChromeMock } from "../mocks/chrome";
import SettingsView from "../../src/popup/components/SettingsView.svelte";
import { DEFAULT_SETTINGS } from "../../src/shared/settings/defaults";
import { getMessages, resolveUiLocale } from "../../src/shared/i18n";

// T004 : chaque scénario s'exécute aux deux locales, textes attendus tirés du
// catalogue de la locale résolue (mock getUILanguage pilotable).
const languages = ["fr", "en-US"] as const;

describe.each(languages)(
  "SettingsView (FR-003/FR-004/FR-008/FR-011) — locale %s",
  (language) => {
    const m = getMessages(resolveUiLocale(language));
    let mock: ChromeMock;

    beforeEach(() => {
      mock = createChromeMock();
      mock.setUiLanguage(language);
      vi.stubGlobal("chrome", mock.chrome);
    });

    afterEach(() => {
      cleanup();
      vi.unstubAllGlobals();
    });

    function renderView(overrides: Partial<typeof DEFAULT_SETTINGS> = {}): {
      onChange: ReturnType<typeof vi.fn>;
    } {
      const onChange = vi.fn();
      render(SettingsView, {
        settings: { ...DEFAULT_SETTINGS, ...overrides },
        onChange,
      });
      return { onChange };
    }

    function getSpinbutton(name: string): HTMLInputElement {
      return screen.getByRole("spinbutton", { name }) as HTMLInputElement;
    }

    it("affiche l'interrupteur désactivé et les valeurs par défaut des 5 champs (FR-003/FR-004/FR-011)", () => {
      renderView();
      const toggle = screen.getByRole("switch", {
        name: m.settings.autoDisplay,
      });
      expect(toggle.getAttribute("aria-checked")).toBe("false");
      expect(getSpinbutton(m.settings.interval).value).toBe("25");
      expect(getSpinbutton(m.settings.focus).value).toBe("25");
      expect(getSpinbutton(m.settings.break).value).toBe("5");
      expect(getSpinbutton(m.settings.longBreak).value).toBe("15");
      expect(getSpinbutton(m.settings.repetitions).value).toBe("4");
    });

    it("chaque réglage est une ligne de grille deux colonnes identique (FR-008)", () => {
      renderView();
      const rows = [
        m.settings.autoDisplay,
        m.settings.interval,
        m.settings.focus,
        m.settings.break,
        m.settings.longBreak,
        m.settings.repetitions,
      ].map((label) => screen.getByText(label).closest("div"));

      // Gouttière verticale identique : une seule classe de ligne partagée.
      const classNames = new Set(rows.map((row) => row?.className));
      expect(classNames.size).toBe(1);
      expect([...classNames][0]).toContain("grid-cols-[1fr_auto]");
      expect([...classNames][0]).toContain("items-center");
      // Label en colonne 1, champ en colonne 2 (dernier enfant de la ligne).
      for (const row of rows) {
        expect(row?.querySelector("label")).toBeTruthy();
        const field = row?.lastElementChild;
        const fieldEl = field?.matches("input, button")
          ? field
          : field?.querySelector("input, button");
        expect(fieldEl).toBeTruthy();
      }
    });

    it("erreur traduite sous le champ concerné, alignement des lignes suivant intact (FR-009)", async () => {
      const { onChange } = renderView();
      const interval = getSpinbutton(m.settings.interval);
      await fireEvent.input(interval, { target: { value: "0" } });

      const alert = screen.getByRole("alert");
      expect(alert.textContent).toBe(m.errors.minutesRange);
      // L'erreur vit dans la colonne 2 de la ligne du champ concerné, pas
      // dans celle des lignes suivantes.
      expect(alert.closest("div")?.contains(interval)).toBe(true);
      const focusRow = screen.getByText(m.settings.focus).closest("div");
      expect(focusRow?.className).toContain("grid-cols-[1fr_auto]");
      expect(focusRow?.querySelector("[role='alert']")).toBeNull();
      expect(onChange).not.toHaveBeenCalled();
    });

    it("activer l'interrupteur appelle onChange avec autoDisplayEnabled=true (FR-003)", async () => {
      const { onChange } = renderView();
      await fireEvent.click(
        screen.getByRole("switch", { name: m.settings.autoDisplay }),
      );
      expect(onChange).toHaveBeenCalledWith({
        ...DEFAULT_SETTINGS,
        autoDisplayEnabled: true,
      });
    });

    it("intervalle valide : onChange appelé avec la nouvelle valeur (application immédiate)", async () => {
      const { onChange } = renderView();
      await fireEvent.input(getSpinbutton(m.settings.interval), {
        target: { value: "10" },
      });
      expect(onChange).toHaveBeenCalledWith({
        ...DEFAULT_SETTINGS,
        intervalMinutes: 10,
      });
    });

    it("bornes 1 et 1440 acceptées", async () => {
      const { onChange } = renderView();
      const interval = getSpinbutton(m.settings.interval);
      await fireEvent.input(interval, { target: { value: "1" } });
      expect(onChange).toHaveBeenLastCalledWith({
        ...DEFAULT_SETTINGS,
        intervalMinutes: 1,
      });
      await fireEvent.input(interval, { target: { value: "1440" } });
      expect(onChange).toHaveBeenLastCalledWith({
        ...DEFAULT_SETTINGS,
        intervalMinutes: 1440,
      });
    });

    it("saisie 0 refusée : message compréhensible, dernière valeur valide conservée, pas de onChange (FR-008)", async () => {
      const { onChange } = renderView();
      const interval = getSpinbutton(m.settings.interval);
      await fireEvent.input(interval, { target: { value: "0" } });
      expect(screen.getByRole("alert").textContent).toBe(m.errors.minutesRange);
      expect(onChange).not.toHaveBeenCalled();
      // Dernière valeur valide conservée dans le champ (réutilise la ref).
      expect(interval.value).toBe("25");
    });

    it("saisie 1500 refusée (FR-008)", async () => {
      const { onChange } = renderView();
      await fireEvent.input(getSpinbutton(m.settings.interval), {
        target: { value: "1500" },
      });
      expect(screen.getByRole("alert").textContent).toBe(m.errors.minutesRange);
      expect(onChange).not.toHaveBeenCalled();
    });

    it("saisie non entière refusée (FR-008)", async () => {
      const { onChange } = renderView();
      await fireEvent.input(getSpinbutton(m.settings.interval), {
        target: { value: "25.5" },
      });
      expect(screen.getByRole("alert").textContent).toBe(m.errors.minutesRange);
      expect(onChange).not.toHaveBeenCalled();
    });

    it("après une saisie refusée, une saisie valide efface le message et applique", async () => {
      const { onChange } = renderView();
      const interval = getSpinbutton(m.settings.interval);
      await fireEvent.input(interval, { target: { value: "0" } });
      await fireEvent.input(interval, { target: { value: "30" } });
      expect(screen.queryByRole("alert")).toBeNull();
      expect(onChange).toHaveBeenCalledWith({
        ...DEFAULT_SETTINGS,
        intervalMinutes: 30,
      });
    });

    it("focus valide : onChange appelé avec la nouvelle valeur (FR-011)", async () => {
      const { onChange } = renderView();
      await fireEvent.input(getSpinbutton(m.settings.focus), {
        target: { value: "30" },
      });
      expect(onChange).toHaveBeenCalledWith({
        ...DEFAULT_SETTINGS,
        focusMinutes: 30,
      });
    });

    it("pause valide : onChange appelé avec la nouvelle valeur (FR-011)", async () => {
      const { onChange } = renderView();
      await fireEvent.input(getSpinbutton(m.settings.break), {
        target: { value: "10" },
      });
      expect(onChange).toHaveBeenCalledWith({
        ...DEFAULT_SETTINGS,
        breakMinutes: 10,
      });
    });

    it("longue pause valide : onChange appelé avec la nouvelle valeur (FR-011)", async () => {
      const { onChange } = renderView();
      await fireEvent.input(getSpinbutton(m.settings.longBreak), {
        target: { value: "20" },
      });
      expect(onChange).toHaveBeenCalledWith({
        ...DEFAULT_SETTINGS,
        longBreakMinutes: 20,
      });
    });

    it("répétitions valide : onChange appelé avec la nouvelle valeur (FR-011)", async () => {
      const { onChange } = renderView();
      await fireEvent.input(getSpinbutton(m.settings.repetitions), {
        target: { value: "6" },
      });
      expect(onChange).toHaveBeenCalledWith({
        ...DEFAULT_SETTINGS,
        repetitionsBeforeLongBreak: 6,
      });
    });

    it("répétitions 0 refusée : message répétitions, pas de onChange (FR-011)", async () => {
      const { onChange } = renderView();
      await fireEvent.input(getSpinbutton(m.settings.repetitions), {
        target: { value: "0" },
      });
      expect(screen.getByRole("alert").textContent).toBe(
        m.errors.repetitionsRange,
      );
      expect(onChange).not.toHaveBeenCalled();
    });

    it("répétitions 11 refusée : message répétitions, pas de onChange (FR-011)", async () => {
      const { onChange } = renderView();
      await fireEvent.input(getSpinbutton(m.settings.repetitions), {
        target: { value: "11" },
      });
      expect(screen.getByRole("alert").textContent).toBe(
        m.errors.repetitionsRange,
      );
      expect(onChange).not.toHaveBeenCalled();
    });

    it("focus 0 refusée : message minutes, pas de onChange (FR-011)", async () => {
      const { onChange } = renderView();
      await fireEvent.input(getSpinbutton(m.settings.focus), {
        target: { value: "0" },
      });
      expect(screen.getByRole("alert").textContent).toBe(m.errors.minutesRange);
      expect(onChange).not.toHaveBeenCalled();
    });

    it("focus 1500 refusée : message minutes, pas de onChange (FR-011)", async () => {
      const { onChange } = renderView();
      await fireEvent.input(getSpinbutton(m.settings.focus), {
        target: { value: "1500" },
      });
      expect(screen.getByRole("alert").textContent).toBe(m.errors.minutesRange);
      expect(onChange).not.toHaveBeenCalled();
    });

    it("pause 0 refusée : message minutes, pas de onChange (FR-011)", async () => {
      const { onChange } = renderView();
      await fireEvent.input(getSpinbutton(m.settings.break), {
        target: { value: "0" },
      });
      expect(screen.getByRole("alert").textContent).toBe(m.errors.minutesRange);
      expect(onChange).not.toHaveBeenCalled();
    });

    it("longue pause 0 refusée : message minutes, pas de onChange (FR-011)", async () => {
      const { onChange } = renderView();
      await fireEvent.input(getSpinbutton(m.settings.longBreak), {
        target: { value: "0" },
      });
      expect(screen.getByRole("alert").textContent).toBe(m.errors.minutesRange);
      expect(onChange).not.toHaveBeenCalled();
    });

    it("focus non entier refusée : message minutes, pas de onChange (FR-011)", async () => {
      const { onChange } = renderView();
      await fireEvent.input(getSpinbutton(m.settings.focus), {
        target: { value: "25.5" },
      });
      expect(screen.getByRole("alert").textContent).toBe(m.errors.minutesRange);
      expect(onChange).not.toHaveBeenCalled();
    });

    it("porte le copyright sitraka.dev (lien) et la version en pied de page (retour 003)", () => {
      renderView();
      const link = screen.getByRole("link", { name: "sitraka.dev" });
      expect(link.getAttribute("href")).toBe("https://sitraka.dev");
      const footer = screen.getByRole("contentinfo");
      expect(footer.textContent).toContain("v0.1.0");
    });
  },
);
