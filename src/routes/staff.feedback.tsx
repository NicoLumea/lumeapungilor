import { createFileRoute } from "@tanstack/react-router";
import { FeedbackPanel } from "@/components/dashboard/FeedbackPanel";

export const Route = createFileRoute("/staff/feedback")({ component: FeedbackPanel });
