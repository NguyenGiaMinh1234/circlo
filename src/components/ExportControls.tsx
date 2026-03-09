import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Cloud, Download, RotateCcw } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ExportControlsProps {
  onExport: () => void;
  onReset: () => void;
  onSaveToCloud?: () => void;
  isCloudSaving?: boolean;
}

export function ExportControls({ onExport, onReset, onSaveToCloud, isCloudSaving }: ExportControlsProps) {
  const handleExport = () => {
    onExport();
    // toast.success("Đang xuất file...", {
    //   description: "Thiết kế của bạn đang được xuất"
    // });
  };

  const handleReset = () => {
    onReset();
    // toast.info("Đã reset thiết kế", {
    //   description: "Tất cả thay đổi đã được xóa"
    // });
  };

  return (
    <TooltipProvider delayDuration={150}>
      <Card className="border-white/35 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(240,247,255,0.76),rgba(255,241,248,0.72))] p-2 shadow-xl backdrop-blur-xl supports-[backdrop-filter]:bg-[linear-gradient(180deg,rgba(255,255,255,0.76),rgba(240,247,255,0.62),rgba(255,241,248,0.58))]">
        <div className="flex flex-col gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="secondary"
                onClick={handleExport}
                aria-label="Export"
              >
                <Download className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" align="center">Export</TooltipContent>
          </Tooltip>

          {onSaveToCloud && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={onSaveToCloud}
                  disabled={!!isCloudSaving}
                  aria-label="Save to cloud"
                >
                  <Cloud className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left" align="center">
                {isCloudSaving ? "Saving..." : "Save to cloud"}
              </TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="outline"
                onClick={handleReset}
                aria-label="Reset"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" align="center">Reset</TooltipContent>
          </Tooltip>
        </div>
      </Card>
    </TooltipProvider>
  );
}
