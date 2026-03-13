import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, ExternalLink, Star } from "lucide-react";

interface NotableItem {
  description: string;
  date?: string;
  significance: "high" | "medium" | "low";
  source?: string;
  link?: string;
}

interface NotableWorkProps {
  items: NotableItem[];
}

const significanceColors = {
  high: "bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800",
  medium: "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800",
  low: "bg-zinc-50 border-zinc-200 dark:bg-zinc-900 dark:border-zinc-700",
};

export default function NotableWork({ items }: NotableWorkProps) {
  if (!items || items.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Award className="h-5 w-5" />Notable Work
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {items.map((item, i) => {
            const Wrapper = item.link ? "a" : "div";
            const wrapperProps = item.link
              ? { href: item.link, target: "_blank", rel: "noopener noreferrer" }
              : {};
            return (
              <Wrapper key={i} {...wrapperProps} className={`p-3 rounded-lg border group ${significanceColors[item.significance]}`}>
                <div className="flex items-start gap-2">
                  {item.significance === "high" && <Star className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{item.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {item.date && <span className="text-xs text-zinc-500">{item.date}</span>}
                      {item.source && <Badge variant="outline" className="text-xs">{item.source}</Badge>}
                      {item.link && <ExternalLink className="h-3 w-3 text-zinc-400 group-hover:text-blue-500 transition-colors" />}
                    </div>
                  </div>
                </div>
              </Wrapper>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
