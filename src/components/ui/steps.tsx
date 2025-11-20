import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface StepsProps {
    steps: { title: string; description?: string }[];
    currentStep: number;
    className?: string;
}

export function Steps({ steps, currentStep, className }: StepsProps) {
    return (
        <div className={cn("space-y-4", className)}>
            <div className="relative flex items-center justify-between w-full">
                <div className="absolute left-0 top-1/2 w-full h-0.5 bg-muted -z-10" />
                {steps.map((step, index) => {
                    const stepNumber = index + 1;
                    const isCompleted = stepNumber < currentStep;
                    const isCurrent = stepNumber === currentStep;

                    return (
                        <div key={step.title} className="flex flex-col items-center bg-background px-2">
                            <div
                                className={cn(
                                    "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors",
                                    isCompleted
                                        ? "bg-primary border-primary text-primary-foreground"
                                        : isCurrent
                                            ? "border-primary text-primary"
                                            : "border-muted text-muted-foreground"
                                )}
                            >
                                {isCompleted ? <Check className="w-4 h-4" /> : <span className="text-sm font-medium">{stepNumber}</span>}
                            </div>
                            <span
                                className={cn(
                                    "mt-2 text-xs font-medium",
                                    isCurrent ? "text-foreground" : "text-muted-foreground"
                                )}
                            >
                                {step.title}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
