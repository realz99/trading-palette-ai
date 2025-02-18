
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calculator,
  BarChart3,
  ArrowUpDown,
  AlertCircle,
  Signal,
  Lock,
  Eye,
  Target,
  BarChart,
  Settings
} from "lucide-react";

export const TradingInterface = () => {
  const [instruction, setInstruction] = useState("");
  const [parsedData, setParsedData] = useState<any>(null);
  const [positionSize, setPositionSize] = useState("0.01");
  const [riskPercent, setRiskPercent] = useState("1");
  const [leverage, setLeverage] = useState("100");
  const [orderType, setOrderType] = useState("market");
  const { toast } = useToast();
  
  const parseInstruction = (text: string) => {
    // Basic parsing example - would be expanded based on the NLP engine
    const parsed = {
      symbol: text.match(/[A-Z]{6}/)?.[0] || "",
      direction: text.toLowerCase().includes("buy") ? "BUY" : "SELL",
      entry: text.match(/@(\d+\.?\d*)/)?.[1] || "",
      stop: text.match(/sl[:\s]+(\d+\.?\d*)/i)?.[1] || "",
      targets: text.match(/tp[:\s]+(\d+\.?\d*)/i)?.[1] || "",
    };
    setParsedData(parsed);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    parseInstruction(instruction);
    toast({
      title: "Order Parsed",
      description: "Review the parsed data before confirming",
    });
  };

  const calculateRisk = () => {
    const balance = 10000; // Example balance
    const riskAmount = (balance * Number(riskPercent)) / 100;
    const leveragedPosition = riskAmount * Number(leverage);
    return {
      maxPosition: leveragedPosition.toFixed(2),
      riskAmount: riskAmount.toFixed(2)
    };
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6 animate-fadeIn">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Connection Status */}
        <Card className="p-4 backdrop-blur-sm bg-card/50 border border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Signal className="w-4 h-4 text-trading-profit" />
              <span className="text-sm font-medium">MT5 Connected</span>
            </div>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Connection Settings
            </Button>
          </div>
        </Card>

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
            <div className="aspect-[16/9] bg-muted/30 rounded-lg">
              <iframe
                src="https://www.tradingview.com/widgetembed/?frameElementId=tradingview_chart&symbol=EURUSD&interval=D&hidesidetoolbar=1&symboledit=1"
                style={{ width: "100%", height: "100%" }}
                className="rounded-lg"
              />
            </div>
          </Card>

          {/* Trading Controls */}
          <div className="space-y-6">
            <Card className="p-6 backdrop-blur-sm bg-card/50 border border-border/50">
              <h2 className="text-lg font-semibold mb-4">Trading Controls</h2>
              <Tabs defaultValue="ai" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="ai">AI Trading</TabsTrigger>
                  <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                </TabsList>
                
                <TabsContent value="ai" className="space-y-4">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Trading Instruction
                      </label>
                      <Input
                        value={instruction}
                        onChange={(e) => setInstruction(e.target.value)}
                        placeholder="e.g., Buy EURUSD @1.1250 SL:1.1200 TP:1.1300"
                        className="bg-background/50"
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <Button className="flex-1" type="submit">
                        <Eye className="w-4 h-4 mr-2" />
                        Parse
                      </Button>
                      <Button className="flex-1" type="button" disabled={!parsedData}>
                        <Lock className="w-4 h-4 mr-2" />
                        Confirm
                      </Button>
                    </div>
                  </form>
                </TabsContent>
                
                <TabsContent value="manual" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs">Symbol</label>
                      <Input placeholder="EURUSD" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs">Type</label>
                      <select 
                        className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={orderType}
                        onChange={(e) => setOrderType(e.target.value)}
                      >
                        <option value="market">Market</option>
                        <option value="limit">Limit</option>
                        <option value="stop">Stop</option>
                      </select>
                    </div>
                  </div>
                  <Button className="w-full">
                    <Target className="w-4 h-4 mr-2" />
                    Place Manual Order
                  </Button>
                </TabsContent>
              </Tabs>
            </Card>

            {/* Parsed Data Display */}
            {parsedData && (
              <Card className="p-4 backdrop-blur-sm bg-card/50 border border-border/50">
                <h3 className="text-sm font-medium mb-2">Parsed Instructions</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Symbol:</span>
                    <span className="font-medium">{parsedData.symbol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Direction:</span>
                    <span className="font-medium">{parsedData.direction}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Entry:</span>
                    <span className="font-medium">{parsedData.entry}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Stop Loss:</span>
                    <span className="font-medium">{parsedData.stop}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Take Profit:</span>
                    <span className="font-medium">{parsedData.targets}</span>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Risk Management */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6 backdrop-blur-sm bg-card/50 border border-border/50">
            <h2 className="text-lg font-semibold mb-4">Risk Calculator</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs">Position Size</label>
                <Input 
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={positionSize}
                  onChange={(e) => setPositionSize(e.target.value)}
                  placeholder="0.01"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs">Risk %</label>
                <Input 
                  type="number"
                  min="0.1"
                  max="5"
                  step="0.1"
                  value={riskPercent}
                  onChange={(e) => setRiskPercent(e.target.value)}
                  placeholder="1"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs">Leverage</label>
                <Input 
                  type="number"
                  min="1"
                  max="1000"
                  step="1"
                  value={leverage}
                  onChange={(e) => setLeverage(e.target.value)}
                  placeholder="100"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs">Max Position</label>
                <div className="h-10 px-3 py-2 rounded-md border bg-muted/30 flex items-center">
                  {calculateRisk().maxPosition}
                </div>
              </div>
            </div>
          </Card>

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
    </div>
  );
};
