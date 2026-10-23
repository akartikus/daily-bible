import { cleanup, fireEvent, render, screen } from "@testing-library/svelte";
import { afterEach, describe, expect, it, vi } from "vitest";
import ErrorView from "../../src/popup/components/ErrorView.svelte";

afterEach(cleanup);

describe("ErrorView (FR-011 : message clair + Réessayer, jamais d'écran vide)", () => {
  it("affiche le message d'erreur passé en prop", () => {
    render(ErrorView, {
      message: "Versets indisponibles. Vérifiez votre connexion et réessayez.",
      onRetry: () => {},
    });
    expect(
      screen.getByText(
        "Versets indisponibles. Vérifiez votre connexion et réessayez.",
      ),
    ).toBeTruthy();
  });

  it("affiche un bouton « Réessayer » qui déclenche onRetry", async () => {
    const onRetry = vi.fn();
    render(ErrorView, { message: "Erreur", onRetry });
    await fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
