import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminBilling() {
    const { profile } = useAuth();

    const handleSubscribe = () => {
        alert("Integração com Mercado Pago será implementada aqui.");
        // Aqui chamaria a edge function mp-create-payment
    };

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">Minha Assinatura</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Plano Atual</CardTitle>
                    <CardDescription>Gerencie a assinatura da sua academia</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-muted p-4 rounded-lg">
                        <p className="font-semibold">BJJ Academy Pro</p>
                        <p className="text-muted-foreground">R$ 197,00 / mês</p>
                    </div>

                    <Button onClick={handleSubscribe} className="w-full sm:w-auto">
                        <CreditCard className="mr-2 h-4 w-4" />
                        Assinar Agora
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
