import type { Metadata } from "next";
import PricingClient from "./PricingClient";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Web services: free first website build, R200/month maintenance retainer (scales to R500 depending on domains), from R500/month CRM & database add-on, custom data engineering quotes. GRC advisory scoped per engagement.",
};

export default function PricingPage() {
  return <PricingClient />;
}
