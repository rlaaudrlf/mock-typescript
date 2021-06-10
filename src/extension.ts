import * as copyPaste from "copy-paste";
import * as vscode from "vscode";
import { commands, window } from "vscode";
import { getSelectedText } from "./lib";
import { getMockFromClass } from "./mockTs/index";

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    commands.registerCommand(
      "mock-typescript.fromSelection",
      transformFromSelection
    )
  );
}

let text = "";

async function transformFromSelection() {
  const { activeTextEditor } = window;
  try {
    let documentText = activeTextEditor?.document.getText();

    let selectedText = await getSelectedText();
    text = getMockFromClass(selectedText, documentText || "");
    copyPaste.copy(text);
  } catch (e) {
    window.showErrorMessage(e.message);
  }
}
