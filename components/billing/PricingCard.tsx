import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MagicCard } from "@/components/ui/magic-card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PricingCardProps {
  title: string;
  price: string;
  description: string;
  features: string[];
  isCurrent?: boolean;
  isPopular?: boolean;
  onSubscribe?: () => void;
  loading?: boolean;
  buttonText?: string;
}

export function PricingCard({
  title,
  price,
  description,
  features,
  isCurrent,
  isPopular,
  onSubscribe,
  loading,
  buttonText = "Upgrade",
}: PricingCardProps) {
  return (
    <MagicCard
      className={cn(
        "relative flex flex-col p-6 h-full",
        isPopular && "border-primary/50 shadow-lg shadow-primary/10"
      )}
      gradientColor={isPopular ? "#3b82f6" : undefined}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground hover:bg-primary">
            Most Popular
          </Badge>
        </div>
      )}

      <div className="mb-5">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>

      <div className="mb-5">
        <span className="text-3xl font-bold text-foreground">{price}</span>
        {price !== "Free" && <span className="text-muted-foreground">/month</span>}
      </div>

      <div className="flex-1 space-y-3 mb-6">
        {features.map((feature, i) => (
          <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
            <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <span>{feature}</span>
          </div>
        ))}
      </div>

      <Button
        className={cn("w-full", isCurrent && "opacity-50 cursor-default")}
        variant={isPopular ? "default" : "outline"}
        onClick={onSubscribe}
        disabled={isCurrent || loading}
      >
        {isCurrent ? "Current Plan" : loading ? "Processing..." : buttonText}
      </Button>
    </MagicCard>
  );
}
