import { useState, useEffect } from 'react';
import { supabase, Database } from '../lib/supabase';
import { CheckCircle, ShoppingBag, Sparkles } from 'lucide-react';

type Order = Database['orders'] & {
  dishes: Database['dishes'];
  fridges: Database['fridges'];
};

interface OrderConfirmationProps {
  orderId: string;
  onClose: () => void;
}

export function OrderConfirmation({ orderId, onClose }: OrderConfirmationProps) {
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        dishes (*),
        fridges (*)
      `)
      .eq('id', orderId)
      .single();

    if (!error && data) {
      setOrder(data as any);
    }
  };

  if (!order) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="max-w-md w-full bg-card rounded-3xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-8 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
          <div className="relative z-10">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in duration-700 delay-200">
              <CheckCircle className="w-12 h-12" />
            </div>
            <h2 className="text-3xl font-bold mb-2">Succès !</h2>
            <p className="text-white/90 text-lg">
              Le frigo est déverrouillé
            </p>
          </div>
        </div>

        <div className="p-6">
          <div className="bg-primary-50 border-2 border-primary rounded-2xl p-4 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <Sparkles className="w-6 h-6 text-primary" />
              <div>
                <p className="text-sm text-gray-600">Points gagnés</p>
                <p className="text-2xl font-bold text-primary">
                  +{order.points_awarded} points
                </p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
              <ShoppingBag className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-1">Votre achat</h3>
                <p className="text-gray-600 text-sm mb-2">
                  {order.quantity}x {order.dishes?.name}
                </p>
                <p className="text-primary font-bold text-lg">
                  {order.total_amount.toFixed(2)}€
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-blue-900 mb-2">
              <strong>Instructions :</strong>
            </p>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>La porte du frigo est maintenant déverrouillée</li>
              <li>Ouvrez et récupérez votre plat</li>
              <li>Refermez bien la porte après utilisation</li>
              <li>Bon appétit !</li>
            </ol>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-primary text-white font-semibold py-4 rounded-xl hover:bg-primary-700 transition-colors shadow-lg hover:shadow-xl"
          >
            Terminer
          </button>
        </div>
      </div>
    </div>
  );
}
