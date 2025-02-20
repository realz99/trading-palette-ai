import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calculator,
  ArrowUpDown,
  AlertCircle,
  Signal,
  Lock,
  Eye,
  Target,
  Settings,
  XCircle,
  RotateCcw,
  Ban,
  DollarSign,
} from "lucide-react";

export const TradingInterface = () => {
  const [instruction, setInstruction] = useState("");
  const [parsedData, setParsedData] = useState<any>(null);
  const [positionSize, setPositionSize] = useState<number>(0.01);
  const [riskPercent, setRiskPercent] = useState<number>(1);
  const [leverage, setLeverage] = useState<number>(100);
  const [orderType, setOrderType] = useState("market");
  const [entryPrice, setEntryPrice] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit1, setTakeProfit1] = useState("");
  const [takeProfit2, setTakeProfit2] = useState("");
  const [takeProfit3, setTakeProfit3] = useState("");
  const [chartSymbol, setChartSymbol] = useState("XAUUSD");
  const [currentPrice, setCurrentPrice] = useState(0);
  const [isChartLoaded, setIsChartLoaded] = useState(false);
  const [hasActivePositions, setHasActivePositions] = useState(false);
  const { toast } = useToast();

  const handleParse = () => {
    console.log("Parsing instruction:", instruction);
    const parsed = parseInstruction(instruction);
    if (parsed) {
      toast({
        title: "Order Parsed Successfully",
        description: `${parsed.direction} ${parsed.symbol} with ${parsed.targets.length} TP levels`,
      });
      console.log("Parsed data:", parsed);
    }
  };

  const parseInstruction = (text: string) => {
    try {
      const symbolMatch = text.match(/([A-Z]{6}|XAUUSD)/i);
      const directionMatch = text.toLowerCase().includes("buy") ? "BUY" : "SELL";
      const entryMatch = text.match(/@(\d+\.?\d*)-?(\d+\.?\d*)?/);
      const stopMatch = text.match(/sl:?\s*(\d+\.?\d*)/i);
      
      const allTargets: number[] = [];
      
      const targetsPattern = /targets?:?\s*((?:\d+\.?\d*(?:\s*-\s*)?)+)/i;
      const targetsMatch = text.match(targetsPattern);
      
      if (targetsMatch && targetsMatch[1]) {
        const mainTargets = targetsMatch[1]
          .split(/[-\s]+/)
          .map(t => t.trim())
          .filter(t => t && !isNaN(parseFloat(t)))
          .map(t => parseFloat(t));
        allTargets.push(...mainTargets);
      }

      const extendedPattern = /range:\s*((?:\d+\.?\d*(?:\s*-\s*)?)+)/i;
      const extendedMatch = text.match(extendedPattern);
      
      if (extendedMatch && extendedMatch[1]) {
        const extendedTargets = extendedMatch[1]
          .split(/[-\s]+/)
          .map(t => t.trim())
          .filter(t => t && !isNaN(parseFloat(t)))
          .map(t => parseFloat(t));
        allTargets.push(...extendedTargets);
      }

      const remainingNumbers = text.match(/\b\d+\.?\d*\b/g);
      if (remainingNumbers) {
        const parsedNumbers = remainingNumbers
          .map(n => parseFloat(n))
          .filter(n => {
            const isEntry = entryMatch && (n === parseFloat(entryMatch[1]) || (entryMatch[2] && n === parseFloat(entryMatch[2])));
            const isStop = stopMatch && n === parseFloat(stopMatch[1]);
            return !isEntry && !isStop && !allTargets.includes(n);
          });
        allTargets.push(...parsedNumbers);
      }

      const symbol = symbolMatch ? symbolMatch[0].toUpperCase() : "";
      
      if (symbol && symbol !== chartSymbol) {
        setChartSymbol(symbol);
      }

      const parsed = {
        symbol,
        direction: directionMatch,
        entryMin: entryMatch ? parseFloat(entryMatch[1]) : null,
        entryMax: entryMatch && entryMatch[2] ? parseFloat(entryMatch[2]) : null,
        stop: stopMatch ? parseFloat(stopMatch[1]) : null,
        targets: allTargets,
      };

      console.log("Parsed data:", parsed);
      setParsedData(parsed);

      // Create MT5 order format
      const mt5Order = {
        command: directionMatch === "BUY" ? "TRADE_ACTION_DEAL" : "TRADE_ACTION_SELL",
        symbol: symbol,
        volume: positionSize,
        type: parsed.entryMax ? "ORDER_TYPE_BUY_LIMIT" : "ORDER_TYPE_BUY_STOP",
        price: parsed.entryMin || currentPrice,
        sl: parsed.stop,
        tp: allTargets[0],
        comment: `Auto order with ${allTargets.length} TP levels`,
        type_filling: "ORDER_FILLING_FOK",
        type_time: "ORDER_TIME_GTC",
        deviation: 10
      };

      console.log("MT5 Order Format:", mt5Order);
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

  const calculatePipValue = (symbol: string, lotSize: number = 1) => {
    const pipValues: { [key: string]: number } = {
      XAUUSD: 0.1,
      EURUSD: 0.0001,
      GBPUSD: 0.0001,
      USDJPY: 0.01,
    };
    return pipValues[symbol] || 0.0001;
  };

  const calculateRisk = () => {
    if (!parsedData || !currentPrice) return { maxPosition: "0.00", riskAmount: "0.00" };
    
    const balance = 10000;
    const riskAmount = (balance * Number(riskPercent)) / 100;
    const pipValue = calculatePipValue(parsedData.symbol);
    
    const entryPrice = parsedData.entryMin || currentPrice;
    const stopLossPips = parsedData.stop ? 
      Math.abs(entryPrice - parsedData.stop) / pipValue : 
      0;
    
    if (stopLossPips === 0) return { maxPosition: "0.00", riskAmount: "0.00" };
    
    const leverageMultiplier = Math.min(Number(leverage), 1500);
    const leveragedPosition = (riskAmount / stopLossPips) * leverageMultiplier;
    
    return {
      maxPosition: leveragedPosition.toFixed(2),
      riskAmount: riskAmount.toFixed(2)
    };
  };

  const updateChartOverlay = useCallback((data: any) => {
    if (!isChartLoaded || !data) return;

    const widget = (window as any).TradingView?.widget;
    if (!widget) return;

    try {
      widget.chart().removeAllShapes();

      if (data.entryMin) {
        widget.chart().createShape({
          type: 'horizontal_line',
          price: data.entryMin,
          text: 'Entry',
          color: data.direction === 'BUY' ? '#4CAF50' : '#F44336',
          textColor: '#ffffff',
          disableUndo: false,
        });
      }

      if (data.stop) {
        widget.chart().createShape({
          type: 'horizontal_line',
          price: data.stop,
          text: 'SL',
          color: '#FF5252',
          textColor: '#ffffff',
          disableUndo: false,
        });
      }

      data.targets.forEach((tp: number, index: number) => {
        widget.chart().createShape({
          type: 'horizontal_line',
          price: tp,
          text: `TP${index + 1}`,
          color: '#4CAF50',
          textColor: '#ffffff',
          disableUndo: false,
        });
      });
    } catch (error) {
      console.error("Error drawing chart overlays:", error);
    }
  }, [isChartLoaded]);

  const initializeChart = useCallback(() => {
    const widget = (window as any).TradingView?.widget;
    if (!widget) {
      console.log("TradingView widget not found, retrying...");
      setTimeout(initializeChart, 1000);
      return;
    }

    widget.onChartReady(() => {
      console.log("Chart is ready");
      setIsChartLoaded(true);
      if (parsedData) {
        updateChartOverlay(parsedData);
      }
    });
  }, [parsedData]);

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

  const killAllPositions = () => {
    if (!hasActivePositions) {
      toast({
        title: "No Active Positions",
        description: "There are no positions to close",
        variant: "default"
      });
      return;
    }
    toast({
      title: "Closing All Positions",
      description: "All active positions are being closed",
    });
  };

  const reversePositions = () => {
    if (!hasActivePositions) {
      toast({
        title: "No Active Positions",
        description: "There are no positions to reverse",
        variant: "default"
      });
      return;
    }
    toast({
      title: "Reversing Positions",
      description: "All positions are being reversed",
    });
  };

  const closeAllProfits = () => {
    if (!hasActivePositions) {
      toast({
        title: "No Active Positions",
        description: "There are no profitable positions to close",
        variant: "default"
      });
      return;
    }
    toast({
      title: "Closing Profitable Positions",
      description: "All positions in profit are being closed",
    });
  };

  const closeAllLosses = () => {
    if (!hasActivePositions) {
      toast({
        title: "No Active Positions",
        description: "There are no positions in loss to close",
        variant: "default"
      });
      return;
    }
    toast({
      title: "Closing Loss Positions",
      description: "All positions in loss are being closed",
    });
  };

  const sendToMT5 = async (order: any) => {
    try {
      const request = {
        action: "TRADE_ACTION_DEAL",
        symbol: order.symbol,
        volume: order.volume,
        type: order.type,
        price: order.price,
        sl: order.sl,
        tp: order.tp,
        deviation: order.deviation,
        magic: 123456,
        comment: order.comment,
        type_filling: order.type_filling,
        type_time: order.type_time
      };

      console.log("Sending order to MT5:", request);
      
      toast({
        title: "Order Sent to MT5",
        description: `${order.symbol} ${order.command} order submitted`,
      });
    } catch (error) {
      console.error("MT5 order error:", error);
      toast({
        title: "MT5 Order Error",
        description: "Failed to send order to MT5",
        variant: "destructive"
      });
    }
  };

  const handlePositionSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPositionSize(parseFloat(e.target.value) || 0.01);
  };

  const handleRiskPercentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRiskPercent(parseFloat(e.target.value) || 1);
  };

  const handleLeverageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLeverage(parseFloat(e.target.value) || 100);
  };

  useEffect(() => {
    const iframe = document.querySelector('iframe');
    if (iframe) {
      iframe.src = `https://www.tradingview.com/widgetembed/?frameElementId=tradingview_chart&symbol=${chartSymbol}&interval=D&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=f1f3f6&studies=[]&theme=dark&style=1&timezone=exchange`;
      setIsChartLoaded(false);
      setTimeout(initializeChart, 1000);
    }
  }, [chartSymbol, initializeChart]);

  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-2rem)]">
        <div className="lg:col-span-3 relative">
          <div className="w-full h-full overflow-hidden">
            <iframe
              src={`https://www.tradingview.com/widgetembed/?frameElementId=tradingview_chart&symbol=${chartSymbol}&interval=D&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=f1f3f6&studies=[]&theme=dark&style=1&timezone=exchange`}
              className="w-full h-full rounded-lg"
              style={{ aspectRatio: "16/9", minHeight: "calc(100vh - 2rem)" }}
            />
          </div>
        </div>

        <div className="space-y-4">
          <Card className="p-3 backdrop-blur-sm bg-card/50 border border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Signal className="w-4 h-4 text-green-500" />
                <span className="text-sm">MT5 Connected</span>
              </div>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </Card>

          <Card className="p-4 backdrop-blur-sm bg-card/50 border border-border/50">
            <Tabs defaultValue="ai" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="ai">AI Trading</TabsTrigger>
                <TabsTrigger value="manual">Manual</TabsTrigger>
              </TabsList>
              
              <TabsContent value="ai" className="space-y-4">
                <Input
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  placeholder="e.g., Buy XAUUSD @1900 SL:1880 TP:1920"
                  className="text-sm"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Button size="sm" onClick={handleParse}>
                    <Eye className="w-4 h-4 mr-2" />
                    Parse
                  </Button>
                  <Button size="sm" variant="secondary">
                    <Lock className="w-4 h-4 mr-2" />
                    Execute
                  </Button>
                </div>
                {parsedData && (
                  <div className="bg-muted/30 rounded p-2 text-xs space-y-1">
                    <div>Symbol: {parsedData.symbol}</div>
                    <div>Direction: {parsedData.direction}</div>
                    <div>Entry: {parsedData.entryMin}{parsedData.entryMax ? ` - ${parsedData.entryMax}` : ''}</div>
                    <div>Stop Loss: {parsedData.stop}</div>
                    <div>Targets: {parsedData.targets.join(', ')}</div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="manual" className="space-y-3">
                <div className="grid gap-2">
                  <Input placeholder="Entry Price" size="sm" type="number" step="0.00001" />
                  <Input placeholder="Stop Loss" size="sm" type="number" step="0.00001" />
                  <Input placeholder="Take Profit" size="sm" type="number" step="0.00001" />
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="default" size="sm">Buy</Button>
                    <Button variant="destructive" size="sm">Sell</Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </Card>

          <Card className="p-4 backdrop-blur-sm bg-card/50 border border-border/50">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Risk Calculator</h3>
                <Calculator className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input 
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={positionSize}
                  onChange={handlePositionSizeChange}
                  placeholder="Lot Size"
                  className="text-sm h-8"
                />
                <Input 
                  type="number"
                  min="0.1"
                  max="5"
                  step="0.1"
                  value={riskPercent}
                  onChange={handleRiskPercentChange}
                  placeholder="Risk %"
                  className="text-sm h-8"
                />
              </div>
              <Input 
                type="number"
                min="1"
                max="1500"
                step="1"
                value={leverage}
                onChange={handleLeverageChange}
                placeholder="Leverage"
                className="text-sm h-8"
              />
              <div className="bg-muted/30 rounded p-2 text-sm">
                Max Position: {calculateRisk().maxPosition}
              </div>
            </div>
          </Card>

          {hasActivePositions && (
            <Card className="p-4 backdrop-blur-sm bg-card/50 border border-border/50">
              <div className="space-y-2">
                <h3 className="text-sm font-medium mb-2">Position Management</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" onClick={killAllPositions}>
                    <XCircle className="w-4 h-4 mr-1" />
                    Close All
                  </Button>
                  <Button variant="outline" size="sm" onClick={reversePositions}>
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Reverse
                  </Button>
                  <Button variant="outline" size="sm" onClick={closeAllProfits}>
                    <DollarSign className="w-4 h-4 mr-1" />
                    Take Profit
                  </Button>
                  <Button variant="outline" size="sm" onClick={closeAllLosses}>
                    <Ban className="w-4 h-4 mr-1" />
                    Cut Loss
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
