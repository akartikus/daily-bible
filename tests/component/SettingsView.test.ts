import { cleanup, fireEvent, render, screen } from "@testing-library/svelte";
import { afterEach, describe, expect, it, vi } from "vitest";
import SettingsView from "../../src/popup/components/SettingsView.svelte";
import { DEFAULT_SETTINGS } from "../../src/shared/settings/defaults";

afterEach(cleanup);

const INTERVAL_ERROR = "Entrez un nombre entier entre 1 et 1440.";

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

describe("SettingsView (FR-003/FR-004/FR-008)", () => {
  it("affiche l'interrupteur désactivé et l'intervalle par défaut (FR-003/FR-004)", () => {
    renderView();
    const toggle = screen.getByRole("checkbox", {
      name: "Affichage automatique",
    }) as HTMLInputElement;
    expect(toggle.checked).toBe(false);
    const interval = screen.getByRole("spinbutton", {
      name: "Intervalle (minutes)",
    }) as HTMLInputElement;
    expect(interval.value).toBe("25");
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
    const interval = screen.getByRole("spinbutton", {
      name: "Intervalle (minutes)",
    });
    await fireEvent.input(interval, { target: { value: "10" } });
    expect(onChange).toHaveBeenCalledWith({
      ...DEFAULT_SETTINGS,
      intervalMinutes: 10,
    });
  });

  it("bornes 1 et 1440 acceptées", async () => {
    const { onChange } = renderView();
    const interval = screen.getByRole("spinbutton", {
      name: "Intervalle (minutes)",
    });
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
    const interval = screen.getByRole("spinbutton", {
      name: "Intervalle (minutes)",
    });
    await fireEvent.input(interval, { target: { value: "0" } });
    expect(screen.getByRole("alert").textContent).toBe(INTERVAL_ERROR);
    expect(onChange).not.toHaveBeenCalled();
    expect(
      (
        screen.getByRole("spinbutton", {
          name: "Intervalle (minutes)",
        }) as HTMLInputElement
      ).value,
    ).toBe("25");
  });

  it("saisie 1500 refusée (FR-008)", async () => {
    const { onChange } = renderView();
    const interval = screen.getByRole("spinbutton", {
      name: "Intervalle (minutes)",
    });
    await fireEvent.input(interval, { target: { value: "1500" } });
    expect(screen.getByRole("alert").textContent).toBe(INTERVAL_ERROR);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("saisie non entière refusée (FR-008)", async () => {
    const { onChange } = renderView();
    const interval = screen.getByRole("spinbutton", {
      name: "Intervalle (minutes)",
    });
    await fireEvent.input(interval, { target: { value: "25.5" } });
    expect(screen.getByRole("alert").textContent).toBe(INTERVAL_ERROR);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("après une saisie refusée, une saisie valide efface le message et applique", async () => {
    const { onChange } = renderView();
    const interval = screen.getByRole("spinbutton", {
      name: "Intervalle (minutes)",
    });
    await fireEvent.input(interval, { target: { value: "0" } });
    await fireEvent.input(interval, { target: { value: "30" } });
    expect(screen.queryByRole("alert")).toBeNull();
    expect(onChange).toHaveBeenCalledWith({
      ...DEFAULT_SETTINGS,
      intervalMinutes: 30,
    });
  });
});
