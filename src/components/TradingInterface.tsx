
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
  Settings,
  XCircle,
  RotateCcw,
  Ban,
  DollarSign,
  Trash2
} from "lucide-react";

export const TradingInterface = () => {
  const [instruction, setInstruction] = useState("");
  const [parsedData, setParsedData] = useState<any>(null);
  const [positionSize, setPositionSize] = useState("0.01");
  const [riskPercent, setRiskPercent] = useState("1");
  const [leverage, setLeverage] = useState("100");
  const [orderType, setOrderType] = useState("market");
  const [entryPrice, setEntryPrice] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit1, setTakeProfit1] = useState("");
  const [takeProfit2, setTakeProfit2] = useState("");
  const [takeProfit3, setTakeProfit3] = useState("");
  const { toast } = useToast();
  
  const parseInstruction = (text: string) => {
    try {
      // Enhanced parsing with support for multiple TP levels
      const symbolMatch = text.match(/([A-Z]{6}|XAUUSD)/i);
      const directionMatch = text.toLowerCase().includes("buy") ? "BUY" : "SELL";
      const entryMatch = text.match(/@(\d+\.?\d*)-?(\d+\.?\d*)?/);
      const stopMatch = text.match(/sl:?\s*(\d+\.?\d*)/i);
      const targetsMatch = text.match(/targets?:?\s*((?:\d+\.?\d*\s*-?\s*)*)/i);

      let targets: string[] = [];
      if (targetsMatch && targetsMatch[1]) {
        targets = targetsMatch[1]
          .trim()
          .split(/\s*-\s*/)
          .filter(t => t);
      }

      const parsed = {
        symbol: symbolMatch ? symbolMatch[0].toUpperCase() : "",
        direction: directionMatch,
        entryMin: entryMatch ? parseFloat(entryMatch[1]) : null,
        entryMax: entryMatch && entryMatch[2] ? parseFloat(entryMatch[2]) : null,
        stop: stopMatch ? parseFloat(stopMatch[1]) : null,
        targets: targets.map(t => parseFloat(t)),
      };

      setParsedData(parsed);
      updateChartOverlay(parsed);
      return parsed;
    } catch (error) {
      console.error("Parsing error:", error);
      toast({
        title: "Parsing Error",
        description: "Please check your input format",
        variant: "destructive"
      });
      return null;
    }
  };

  const updateChartOverlay = (data: any) => {
    // This function would update the TradingView chart with overlays
    // Using TradingView's API to draw lines for entry, SL, and TPs
    const chart = (window as any).tradingView?.chart;
    if (!chart || !data) return;

    // Clear existing drawings
    chart.removeAllShapes();

    // Draw entry zone
    if (data.entryMin) {
      chart.createShape({
        type: 'horizontal_line',
        price: data.entryMin,
        text: 'Entry',
        color: data.direction === 'BUY' ? '#4CAF50' : '#F44336'
      });
    }

    // Draw stop loss
    if (data.stop) {
      chart.createShape({
        type: 'horizontal_line',
        price: data.stop,
        text: 'SL',
        color: '#FF5252'
      });
    }

    // Draw take profits
    data.targets.forEach((tp: number, index: number) => {
      chart.createShape({
        type: 'horizontal_line',
        price: tp,
        text: `TP${index + 1}`,
        color: '#4CAF50'
      });
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInstruction(instruction);
    if (parsed) {
      toast({
        title: "Order Parsed Successfully",
        description: `${parsed.direction} ${parsed.symbol} with ${parsed.targets.length} TP levels`,
      });
    }
  };

  const calculateRisk = () => {
    if (!parsedData) return { maxPosition: "0.00", riskAmount: "0.00" };
    
    const balance = 10000; // Example balance
    const riskAmount = (balance * Number(riskPercent)) / 100;
    const pipValue = 0.1; // Example pip value, should be calculated based on symbol
    const stopLossPips = parsedData.stop ? 
      Math.abs(parsedData.entryMin - parsedData.stop) / pipValue : 
      0;
    
    const leveragedPosition = (riskAmount / stopLossPips) * Number(leverage);
    
    return {
      maxPosition: leveragedPosition.toFixed(2),
      riskAmount: riskAmount.toFixed(2)
    };
  };

  // Trading control functions
  const killAllPositions = () => {
    toast({
      title: "Closing All Positions",
      description: "All active positions are being closed",
    });
    // MT5 integration code would go here
  };

  const reversePositions = () => {
    toast({
      title: "Reversing Positions",
      description: "All positions are being reversed",
    });
    // MT5 integration code would go here
  };

  const closeAllProfits = () => {
    toast({
      title: "Closing Profitable Positions",
      description: "All positions in profit are being closed",
    });
    // MT5 integration code would go here
  };

  const closeAllLosses = () => {
    toast({
      title: "Closing Loss Positions",
      description: "All positions in loss are being closed",
    });
    // MT5 integration code would go here
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
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={killAllPositions}>
                  <XCircle className="w-4 h-4 mr-2" />
                  Kill All
                </Button>
                <Button variant="outline" size="sm" onClick={reversePositions}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reverse
                </Button>
                <Button variant="outline" size="sm" onClick={closeAllProfits}>
                  <DollarSign className="w-4 h-4 mr-2" />
                  Close Profits
                </Button>
                <Button variant="outline" size="sm" onClick={closeAllLosses}>
                  <Ban className="w-4 h-4 mr-2" />
                  Close Losses
                </Button>
              </div>
            </div>
            <div className="aspect-[16/9] bg-muted/30 rounded-lg">
              <iframe
                src="https://www.tradingview.com/widgetembed/?frameElementId=tradingview_chart&symbol=EURUSD&interval=D&hidesidetoolbar=1&symboledit=1&saveimage=1&toolbarbg=f1f3f6&studies=[]&theme=dark&style=1&timezone=exchange"
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
                        placeholder="e.g., Buy XAUUSD @1900-1895 SL:1880 Targets: 1910-1920-1930"
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
                      <Input placeholder="XAUUSD" />
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
                    <div className="space-y-2">
                      <label className="text-xs">Entry Price</label>
                      <Input 
                        type="number"
                        value={entryPrice}
                        onChange={(e) => setEntryPrice(e.target.value)}
                        placeholder="0.00"
                        step="0.00001"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs">Stop Loss</label>
                      <Input 
                        type="number"
                        value={stopLoss}
                        onChange={(e) => setStopLoss(e.target.value)}
                        placeholder="0.00"
                        step="0.00001"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs">Take Profit 1</label>
                      <Input 
                        type="number"
                        value={takeProfit1}
                        onChange={(e) => setTakeProfit1(e.target.value)}
                        placeholder="0.00"
                        step="0.00001"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs">Take Profit 2</label>
                      <Input 
                        type="number"
                        value={takeProfit2}
                        onChange={(e) => setTakeProfit2(e.target.value)}
                        placeholder="0.00"
                        step="0.00001"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs">Take Profit 3</label>
                      <Input 
                        type="number"
                        value={takeProfit3}
                        onChange={(e) => setTakeProfit3(e.target.value)}
                        placeholder="0.00"
                        step="0.00001"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs">Volume</label>
                      <Input 
                        type="number"
                        min="0.01"
                        step="0.01"
                        placeholder="0.01"
                      />
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
                    <span className="text-muted-foreground">Entry Zone:</span>
                    <span className="font-medium">
                      {parsedData.entryMin}
                      {parsedData.entryMax ? ` - ${parsedData.entryMax}` : ''}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Stop Loss:</span>
                    <span className="font-medium">{parsedData.stop}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground">Take Profit Levels:</span>
                    {parsedData.targets.map((target: number, index: number) => (
                      <div key={index} className="flex justify-between pl-4">
                        <span className="text-muted-foreground">TP{index + 1}:</span>
                        <span className="font-medium">{target}</span>
                      </div>
                    ))}
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
