import { CreditCard, X } from "lucide-react";
import { QUERY_TYPE_LABELS } from "@/lib/ai/classify";
import type { QueryType } from "@/lib/ai/classify";

interface Props {
  queryType: QueryType;
  cost: number;
  balance: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function CreditConfirm({ queryType, cost, balance, onConfirm, onCancel }: Props) {
  const canAfford = balance >= cost;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-elevated border border-border w-full max-w-sm animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-heading text-lg font-bold text-primary">Kredi Onayı</h3>
          <button onClick={onCancel} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between bg-muted rounded-xl p-4">
            <div>
              <p className="font-body text-sm text-muted-foreground">İşlem türü</p>
              <p className="font-heading font-bold text-primary">{QUERY_TYPE_LABELS[queryType]}</p>
            </div>
            <div className="text-right">
              <p className="font-body text-sm text-muted-foreground">Maliyet</p>
              <p className="font-heading text-2xl font-bold text-accent">{cost}</p>
              <p className="font-body text-xs text-muted-foreground">kredi</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm font-body text-muted-foreground">
            <CreditCard className="w-4 h-4" />
            <span>
              Mevcut bakiye: <strong className="text-foreground">{balance} kredi</strong>
              {canAfford && (
                <span> → işlem sonrası: <strong>{balance - cost} kredi</strong></span>
              )}
            </span>
          </div>

          {!canAfford && (
            <div className="bg-danger/10 border border-danger/30 rounded-lg p-3">
              <p className="font-body text-sm text-danger">
                Yetersiz kredi. En az {cost} kredi gerekiyor.
              </p>
            </div>
          )}
        </div>

        <div className="p-5 pt-0 flex gap-3">
          <button onClick={onCancel} className="flex-1 btn-outline py-2.5">
            İptal
          </button>
          <button
            onClick={onConfirm}
            disabled={!canAfford}
            className="flex-1 btn-accent py-2.5"
          >
            Onayla ({cost} kredi)
          </button>
        </div>
      </div>
    </div>
  );
}
