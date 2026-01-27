"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserStats } from "@/types";
import { Building2, Activity } from "lucide-react";

interface PortfolioPanelProps {
  stats?: UserStats;
  buildingCount: number;
}

export function PortfolioPanel({ stats, buildingCount }: PortfolioPanelProps) {
  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Buildings</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{buildingCount}</div>
            <p className="text-xs text-muted-foreground">
              Active structures
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Grid Usage</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{buildingCount}/100</div>
            <p className="text-xs text-muted-foreground">
              Cells occupied
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network</CardTitle>
            <Badge variant="outline">Base Sepolia</Badge>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mt-1">
              Connected to testnet
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
