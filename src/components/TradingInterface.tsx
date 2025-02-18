
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import {
  Calculator,
  BarChart3,
  ArrowUpDown,
  AlertCircle
} from "lucide-react";

export const TradingInterface = () => {
  const [instruction, setInstruction] = useState("");
  const { toast } = useToast();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Order Submitted",
      description: "Your trading instruction is being processed",
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6 animate-fadeIn">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart Section */}
          <Card className="col-span-2 p-6 backdrop-blur-sm bg-card/50 border border-border/50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Market Overview</h2>
              <Button variant="outline" size="sm">
                <BarChart3 className="w-4 h-4 mr-2" />
                Fullscreen
              </Button>
            </div>
            <div className="aspect-[16/9] bg-muted/30 rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground">Chart Placeholder</p>
            </div>
          </Card>

          {/* Trading Controls */}
          <Card className="p-6 backdrop-blur-sm bg-card/50 border border-border/50">
            <h2 className="text-lg font-semibold mb-4">Trading Controls</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Trading Instruction
                </label>
                <Input
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  placeholder="e.g., Buy EURUSD @1.1250-1.1260"
                  className="bg-background/50"
                />
              </div>
              
              <div className="flex gap-2">
                <Button className="w-full" type="submit">
                  <ArrowUpDown className="w-4 h-4 mr-2" />
                  Place Order
                </Button>
              </div>
            </form>

            <div className="mt-6 pt-6 border-t border-border">
              <h3 className="text-sm font-medium mb-4">Risk Calculator</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs">Position Size</label>
                  <Input type="number" min="0.01" step="0.01" placeholder="0.01" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs">Risk %</label>
                  <Input type="number" min="0.1" max="5" step="0.1" placeholder="1" />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Order Status */}
        <Card className="p-6 backdrop-blur-sm bg-card/50 border border-border/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Order Status</h2>
            <div className="flex items-center text-sm text-muted-foreground">
              <AlertCircle className="w-4 h-4 mr-2" />
              Demo Mode
            </div>
          </div>
          <div className="bg-muted/30 rounded-lg p-4 text-center">
            <p className="text-muted-foreground">No active orders</p>
          </div>
        </Card>
      </div>
    </div>
  );
};
