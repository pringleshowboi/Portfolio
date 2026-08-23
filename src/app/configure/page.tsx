import type { Metadata } from "next";
import ConfigureClient from "./ConfigureClient";

export const metadata: Metadata = {
  title: "Project Configurator",
  description:
    "Scope your project step by step: pick a project type, style, features and get an instant estimated quote. Estimates pending final consultation.",
};

export default function ConfigurePage() {
  return <ConfigureClient />;
}
