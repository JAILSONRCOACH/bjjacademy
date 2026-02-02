import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, CreditCard } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function LockScreen() {
    const { profile } = useAuth();
    const navigate = useNavigate();

    const handlePaymentClick = () => {
        // Navigate to billing page if admin
        if (profile?.role === 'admin') {
            navigate('/admin/billing'); // We will create this route next
        } else {
            // If student/professor, show contact admin message
            window.location.href = "mailto:" + profile?.email;
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md border-destructive">
                <CardHeader className="text-center">
                    <div className="mx-auto bg-destructive/10 p-4 rounded-full w-fit mb-4">
                        <Lock className="h-8 w-8 text-destructive" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-destructive">Acesso Bloqueado</CardTitle>
                    <CardDescription>
                        A assinatura da sua academia expirou.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="text-center text-muted-foreground">
                        {profile?.role === 'admin' ? (
                            <p>
                                O período de teste ou sua última mensalidade venceu.
                                Para continuar acessando o sistema, realize o pagamento.
                            </p>
                        ) : (
                            <p>
                                Entre em contato com o administrador da sua academia para regularizar o acesso.
                            </p>
                        )}
                    </div>

                    {profile?.role === 'admin' && (
                        <Button onClick={handlePaymentClick} className="w-full" variant="destructive">
                            <CreditCard className="mr-2 h-4 w-4" />
                            Regularizar Agora
                        </Button>
                    )}

                    <div className="text-center text-xs text-muted-foreground mt-4">
                        ID da Academia: {profile?.academy_id}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
