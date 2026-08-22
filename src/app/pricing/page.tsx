import type { Metadata } from "next";
import PricingClient from "./PricingClient";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Web services: free first website build, R50/month maintenance retainer, from R500/month CRM & database add-on, custom data engineering quotes. GRC advisory scoped per engagement.",
};

export default function PricingPage() {
  return <PricingClient />;
}
