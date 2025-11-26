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
  badge?: string;
  onSubscribe?: () => void;
  loading?: boolean;
  buttonText?: string;
}

export function PricingCard({
  title,
  price,
  description,
  features,
  isCurrent = false,
  isPopular = false,
  badge,
  onSubscribe,
  loading = false,
  buttonText,
}: PricingCardProps) {
  return (
    <MagicCard
      className={cn(
        "relative p-6 transition-all hover:shadow-xl",
        isCurrent && "ring-2 ring-primary"
      )}
      gradientColor={isCurrent ? "#3b82f6" : undefined}
    >
      <div className="flex flex-col h-full">
        {(isPopular || badge) && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <Badge className="bg-primary text-primary-foreground hover:bg-primary">
              {badge || "Most Popular"}
            </Badge>
          </div>
        )}

        <div className="mb-4">
          <h3 className="text-xl font-bold">{title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>

        <div className="mb-6">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold">{price}</span>
            <span className="text-sm text-muted-foreground">/month</span>
          </div>
        </div>

        {/* Features - flex-grow pushes button to bottom */}
        <ul className="space-y-3 mb-6 flex-grow">
          {features.map((feature, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        {/* Button at bottom */}
        <Button
          onClick={onSubscribe}
          disabled={isCurrent || loading}
          variant={isCurrent ? "outline" : "default"}
          className="w-full"
        >
          {loading
            ? "Processing..."
            : isCurrent
              ? "Current Plan"
              : buttonText || "Subscribe"}
        </Button>
      </div>
    </MagicCard>
  );
}
