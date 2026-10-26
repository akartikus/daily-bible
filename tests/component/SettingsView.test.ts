import { cleanup, fireEvent, render, screen } from "@testing-library/svelte";
import { afterEach, describe, expect, it, vi } from "vitest";
import SettingsView from "../../src/popup/components/SettingsView.svelte";
import { DEFAULT_SETTINGS } from "../../src/shared/settings/defaults";

afterEach(cleanup);

const MINUTES_ERROR = "Entrez un nombre entier entre 1 et 1440.";
const REPETITIONS_ERROR = "Entrez un nombre entier entre 1 et 10.";

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

describe("SettingsView (FR-003/FR-004/FR-008/FR-011)", () => {
  it("affiche l'interrupteur désactivé et les valeurs par défaut des 5 champs (FR-003/FR-004/FR-011)", () => {
    renderView();
    const toggle = screen.getByRole("checkbox", {
      name: "Affichage automatique",
    }) as HTMLInputElement;
    expect(toggle.checked).toBe(false);
    expect(getSpinbutton("Intervalle (minutes)").value).toBe("25");
    expect(getSpinbutton("Focus (minutes)").value).toBe("25");
    expect(getSpinbutton("Pause (minutes)").value).toBe("5");
    expect(getSpinbutton("Longue pause (minutes)").value).toBe("15");
    expect(getSpinbutton("Répétitions avant longue pause").value).toBe("4");
  });

  it("activer l'interrupteur appelle onChange avec autoDisplayEnabled=true (FR-003)", async () => {
    const { onChange } = renderView();
    await fireEvent.click(
      screen.getByRole("checkbox", { name: "Affichage automatique" }),
    );
    expect(onChange).toHaveBeenCalledWith({
      ...DEFAULT_SETTINGS,
      autoDisplayEnabled: true,
    });
  });

  it("intervalle valide : onChange appelé avec la nouvelle valeur (application immédiate)", async () => {
    const { onChange } = renderView();
    await fireEvent.input(getSpinbutton("Intervalle (minutes)"), {
      target: { value: "10" },
    });
    expect(onChange).toHaveBeenCalledWith({
      ...DEFAULT_SETTINGS,
      intervalMinutes: 10,
    });
  });

  it("bornes 1 et 1440 acceptées", async () => {
    const { onChange } = renderView();
    const interval = getSpinbutton("Intervalle (minutes)");
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
    const interval = getSpinbutton("Intervalle (minutes)");
    await fireEvent.input(interval, { target: { value: "0" } });
    expect(screen.getByRole("alert").textContent).toBe(MINUTES_ERROR);
    expect(onChange).not.toHaveBeenCalled();
    // Error text is inside the label, so the accessible name changes; reuse the ref.
    expect(interval.value).toBe("25");
  });

  it("saisie 1500 refusée (FR-008)", async () => {
    const { onChange } = renderView();
    await fireEvent.input(getSpinbutton("Intervalle (minutes)"), {
      target: { value: "1500" },
    });
    expect(screen.getByRole("alert").textContent).toBe(MINUTES_ERROR);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("saisie non entière refusée (FR-008)", async () => {
    const { onChange } = renderView();
    await fireEvent.input(getSpinbutton("Intervalle (minutes)"), {
      target: { value: "25.5" },
    });
    expect(screen.getByRole("alert").textContent).toBe(MINUTES_ERROR);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("après une saisie refusée, une saisie valide efface le message et applique", async () => {
    const { onChange } = renderView();
    const interval = getSpinbutton("Intervalle (minutes)");
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
    await fireEvent.input(getSpinbutton("Focus (minutes)"), {
      target: { value: "30" },
    });
    expect(onChange).toHaveBeenCalledWith({
      ...DEFAULT_SETTINGS,
      focusMinutes: 30,
    });
  });

  it("pause valide : onChange appelé avec la nouvelle valeur (FR-011)", async () => {
    const { onChange } = renderView();
    await fireEvent.input(getSpinbutton("Pause (minutes)"), {
      target: { value: "10" },
    });
    expect(onChange).toHaveBeenCalledWith({
      ...DEFAULT_SETTINGS,
      breakMinutes: 10,
    });
  });

  it("longue pause valide : onChange appelé avec la nouvelle valeur (FR-011)", async () => {
    const { onChange } = renderView();
    await fireEvent.input(getSpinbutton("Longue pause (minutes)"), {
      target: { value: "20" },
    });
    expect(onChange).toHaveBeenCalledWith({
      ...DEFAULT_SETTINGS,
      longBreakMinutes: 20,
    });
  });

  it("répétitions valide : onChange appelé avec la nouvelle valeur (FR-011)", async () => {
    const { onChange } = renderView();
    await fireEvent.input(getSpinbutton("Répétitions avant longue pause"), {
      target: { value: "6" },
    });
    expect(onChange).toHaveBeenCalledWith({
      ...DEFAULT_SETTINGS,
      repetitionsBeforeLongBreak: 6,
    });
  });

  it("répétitions 0 refusée : message répétitions, pas de onChange (FR-011)", async () => {
    const { onChange } = renderView();
    await fireEvent.input(getSpinbutton("Répétitions avant longue pause"), {
      target: { value: "0" },
    });
    expect(screen.getByRole("alert").textContent).toBe(REPETITIONS_ERROR);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("répétitions 11 refusée : message répétitions, pas de onChange (FR-011)", async () => {
    const { onChange } = renderView();
    await fireEvent.input(getSpinbutton("Répétitions avant longue pause"), {
      target: { value: "11" },
    });
    expect(screen.getByRole("alert").textContent).toBe(REPETITIONS_ERROR);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("focus 0 refusée : message minutes, pas de onChange (FR-011)", async () => {
    const { onChange } = renderView();
    await fireEvent.input(getSpinbutton("Focus (minutes)"), {
      target: { value: "0" },
    });
    expect(screen.getByRole("alert").textContent).toBe(MINUTES_ERROR);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("focus 1500 refusée : message minutes, pas de onChange (FR-011)", async () => {
    const { onChange } = renderView();
    await fireEvent.input(getSpinbutton("Focus (minutes)"), {
      target: { value: "1500" },
    });
    expect(screen.getByRole("alert").textContent).toBe(MINUTES_ERROR);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("pause 0 refusée : message minutes, pas de onChange (FR-011)", async () => {
    const { onChange } = renderView();
    await fireEvent.input(getSpinbutton("Pause (minutes)"), {
      target: { value: "0" },
    });
    expect(screen.getByRole("alert").textContent).toBe(MINUTES_ERROR);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("longue pause 0 refusée : message minutes, pas de onChange (FR-011)", async () => {
    const { onChange } = renderView();
    await fireEvent.input(getSpinbutton("Longue pause (minutes)"), {
      target: { value: "0" },
    });
    expect(screen.getByRole("alert").textContent).toBe(MINUTES_ERROR);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("focus non entier refusée : message minutes, pas de onChange (FR-011)", async () => {
    const { onChange } = renderView();
    await fireEvent.input(getSpinbutton("Focus (minutes)"), {
      target: { value: "25.5" },
    });
    expect(screen.getByRole("alert").textContent).toBe(MINUTES_ERROR);
    expect(onChange).not.toHaveBeenCalled();
  });
});
