import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, KeyRound, Check, User, MapPin } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { maskCPF, maskPhone, maskCEP } from '@/lib/masks';

const BELT_OPTIONS = [
    { value: 'white', label: 'Branca' },
    { value: 'blue', label: 'Azul' },
    { value: 'purple', label: 'Roxa' },
    { value: 'brown', label: 'Marrom' },
    { value: 'black', label: 'Preta' },
];

const STATE_OPTIONS = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export default function ProfessorSettings() {
    const { profile } = useAuth();
    const profileData$ = profile as any;
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isProfileLoading, setIsProfileLoading] = useState(false);
    const [isCepLoading, setIsCepLoading] = useState(false);
    const [passwordSuccess, setPasswordSuccess] = useState(false);
    const [profileSuccess, setProfileSuccess] = useState(false);

    const [passwords, setPasswords] = useState({
        current: '',
        new: '',
        confirm: '',
    });

    const [profileData, setProfileData] = useState({
        name: '',
        email: '',
        phone: '',
        cpf: '',
        rg: '',
        birth_date: '',
        belt: 'black',
        stripes: 0,
        address_street: '',
        address_number: '',
        address_complement: '',
        address_neighborhood: '',
        address_city: '',
        address_state: '',
        address_zip: '',
    });

    // Load profile data
    useEffect(() => {
        if (profileData$) {
            setProfileData({
                name: profileData$.name || '',
                email: profileData$.email || '',
                phone: profileData$.phone || '',
                cpf: profileData$.cpf || '',
                rg: profileData$.rg || '',
                birth_date: profileData$.birth_date || '',
                belt: profileData$.belt || 'black',
                stripes: profileData$.stripes || 0,
                address_street: profileData$.address_street || '',
                address_number: profileData$.address_number || '',
                address_complement: profileData$.address_complement || '',
                address_neighborhood: profileData$.address_neighborhood || '',
                address_city: profileData$.address_city || '',
                address_state: profileData$.address_state || '',
                address_zip: profileData$.address_zip || '',
            });
        }
    }, [profileData$]);

    // CEP lookup function
    const handleCepLookup = async (cep: string) => {
        const cleanCep = cep.replace(/\D/g, '');
        if (cleanCep.length !== 8) return;

        setIsCepLoading(true);
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
            const data = await response.json();

            if (data.erro) {
                toast({
                    title: 'CEP não encontrado',
                    description: 'Verifique o CEP digitado.',
                    variant: 'destructive',
                });
                return;
            }

            setProfileData(prev => ({
                ...prev,
                address_street: data.logradouro || prev.address_street,
                address_neighborhood: data.bairro || prev.address_neighborhood,
                address_city: data.localidade || prev.address_city,
                address_state: data.uf || prev.address_state,
            }));

            toast({
                title: 'Endereço encontrado!',
                description: `${data.logradouro}, ${data.bairro} - ${data.localidade}/${data.uf}`,
            });
        } catch (error) {
            toast({
                title: 'Erro ao buscar CEP',
                description: 'Não foi possível buscar o endereço.',
                variant: 'destructive',
            });
        } finally {
            setIsCepLoading(false);
        }
    };

    // Get max stripes based on belt
    const getMaxStripes = () => {
        if (['black', 'red_black', 'red_white', 'red'].includes(profileData.belt)) {
            return 10;
        }
        return 4;
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (passwords.new !== passwords.confirm) {
            toast({
                title: 'Senhas não conferem',
                description: 'A nova senha e a confirmação devem ser iguais.',
                variant: 'destructive',
            });
            return;
        }

        if (passwords.new.length < 6) {
            toast({
                title: 'Senha muito curta',
                description: 'A nova senha deve ter pelo menos 6 caracteres.',
                variant: 'destructive',
            });
            return;
        }

        setIsLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({
                password: passwords.new
            });

            if (error) throw error;

            setPasswordSuccess(true);
            setPasswords({ current: '', new: '', confirm: '' });
            toast({
                title: 'Senha alterada com sucesso!',
                description: 'Sua nova senha já está ativa.',
            });
        } catch (error: any) {
            toast({
                title: 'Erro ao alterar senha',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProfileLoading(true);

        const updateData = {
            name: profileData.name,
            email: profileData.email || null,
            phone: profileData.phone ? profileData.phone.replace(/\D/g, '') : null,
            cpf: profileData.cpf ? profileData.cpf.replace(/\D/g, '') : null,
            rg: profileData.rg || null,
            birth_date: profileData.birth_date || null,
            belt: profileData.belt as any,
            stripes: profileData.stripes,
            address_street: profileData.address_street || null,
            address_number: profileData.address_number || null,
            address_complement: profileData.address_complement || null,
            address_neighborhood: profileData.address_neighborhood || null,
            address_city: profileData.address_city || null,
            address_state: profileData.address_state || null,
            address_zip: profileData.address_zip ? profileData.address_zip.replace(/\D/g, '') : null,
        };

        console.log('Updating profile with:', updateData);
        console.log('Profile ID:', profile?.id);

        try {
            const { data, error } = await supabase
                .from('profiles')
                .update(updateData)
                .eq('id', profile?.id)
                .select();

            console.log('Update response:', { data, error });

            if (error) throw error;

            setProfileSuccess(true);
            setTimeout(() => setProfileSuccess(false), 3000);

            toast({
                title: 'Perfil atualizado!',
                description: 'Suas informações foram salvas com sucesso.',
            });
        } catch (error: any) {
            console.error('Profile update error:', error);
            toast({
                title: 'Erro ao atualizar perfil',
                description: error.message || JSON.stringify(error),
                variant: 'destructive',
            });
        } finally {
            setIsProfileLoading(false);
        }
    };

    return (
        <DashboardLayout title="Configurações">
            <div className="max-w-3xl space-y-6">
                {/* Profile Edit Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Meu Perfil
                        </CardTitle>
                        <CardDescription>
                            Atualize suas informações pessoais
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleUpdateProfile} className="space-y-6">
                            {/* Personal Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nome Completo *</Label>
                                    <Input
                                        id="name"
                                        value={profileData.name}
                                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={profileData.email}
                                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                        placeholder="professor@email.com"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Telefone</Label>
                                    <Input
                                        id="phone"
                                        value={profileData.phone ? maskPhone(profileData.phone) : ''}
                                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                        placeholder="(00) 00000-0000"
                                        maxLength={15}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="cpf">CPF</Label>
                                    <Input
                                        id="cpf"
                                        value={profileData.cpf ? maskCPF(profileData.cpf) : ''}
                                        onChange={(e) => setProfileData({ ...profileData, cpf: e.target.value })}
                                        placeholder="000.000.000-00"
                                        maxLength={14}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="rg">RG</Label>
                                    <Input
                                        id="rg"
                                        value={profileData.rg}
                                        onChange={(e) => setProfileData({ ...profileData, rg: e.target.value })}
                                        placeholder="0000000"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="birth_date">Data de Nascimento</Label>
                                    <Input
                                        id="birth_date"
                                        type="date"
                                        value={profileData.birth_date}
                                        onChange={(e) => setProfileData({ ...profileData, birth_date: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Belt Info */}
                            <div className="border-t pt-4">
                                <h4 className="font-medium mb-3 text-sm text-muted-foreground uppercase tracking-wide">Dados de Atleta</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="belt">Faixa</Label>
                                        <Select
                                            value={profileData.belt}
                                            onValueChange={(value) => setProfileData({ ...profileData, belt: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione a faixa" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {BELT_OPTIONS.map((belt) => (
                                                    <SelectItem key={belt.value} value={belt.value}>
                                                        {belt.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="stripes">Graus (0-{getMaxStripes()})</Label>
                                        <Select
                                            value={String(profileData.stripes)}
                                            onValueChange={(value) => setProfileData({ ...profileData, stripes: parseInt(value) })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Graus" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Array.from({ length: getMaxStripes() + 1 }, (_, i) => i).map((s) => (
                                                    <SelectItem key={s} value={String(s)}>
                                                        {s} {s === 1 ? 'grau' : 'graus'}
                                                        {s >= 7 && s <= 8 && ' (Mestre)'}
                                                        {s >= 9 && ' (Grão Mestre)'}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            {/* Address */}
                            <div className="border-t pt-4">
                                <h4 className="font-medium mb-3 text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    Endereço
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2 md:col-span-2">
                                        <Label htmlFor="address_street">Rua</Label>
                                        <Input
                                            id="address_street"
                                            value={profileData.address_street}
                                            onChange={(e) => setProfileData({ ...profileData, address_street: e.target.value })}
                                            placeholder="Nome da rua"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="address_number">Número</Label>
                                        <Input
                                            id="address_number"
                                            value={profileData.address_number}
                                            onChange={(e) => setProfileData({ ...profileData, address_number: e.target.value })}
                                            placeholder="123"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="address_complement">Complemento</Label>
                                        <Input
                                            id="address_complement"
                                            value={profileData.address_complement}
                                            onChange={(e) => setProfileData({ ...profileData, address_complement: e.target.value })}
                                            placeholder="Apto, Bloco..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="address_neighborhood">Bairro</Label>
                                        <Input
                                            id="address_neighborhood"
                                            value={profileData.address_neighborhood}
                                            onChange={(e) => setProfileData({ ...profileData, address_neighborhood: e.target.value })}
                                            placeholder="Bairro"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="address_zip">CEP</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id="address_zip"
                                                value={profileData.address_zip ? maskCEP(profileData.address_zip) : ''}
                                                onChange={(e) => {
                                                    const newCep = e.target.value;
                                                    setProfileData({ ...profileData, address_zip: newCep });
                                                    // Auto-lookup when CEP is complete
                                                    if (newCep.replace(/\D/g, '').length === 8) {
                                                        handleCepLookup(newCep);
                                                    }
                                                }}
                                                placeholder="00000-000"
                                                maxLength={9}
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                disabled={isCepLoading || profileData.address_zip.replace(/\D/g, '').length !== 8}
                                                onClick={() => handleCepLookup(profileData.address_zip)}
                                            >
                                                {isCepLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="address_city">Cidade</Label>
                                        <Input
                                            id="address_city"
                                            value={profileData.address_city}
                                            onChange={(e) => setProfileData({ ...profileData, address_city: e.target.value })}
                                            placeholder="Cidade"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="address_state">Estado</Label>
                                        <Select
                                            value={profileData.address_state}
                                            onValueChange={(value) => setProfileData({ ...profileData, address_state: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="UF" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {STATE_OPTIONS.map((state) => (
                                                    <SelectItem key={state} value={state}>
                                                        {state}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            <Button type="submit" disabled={isProfileLoading} className="w-full">
                                {isProfileLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {profileSuccess ? (
                                    <>
                                        <Check className="mr-2 h-4 w-4" />
                                        Salvo!
                                    </>
                                ) : (
                                    'Salvar Alterações'
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Change Password Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <KeyRound className="h-5 w-5" />
                            Alterar Senha
                        </CardTitle>
                        <CardDescription>
                            Altere sua senha de acesso ao sistema
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {passwordSuccess ? (
                            <div className="bg-green-50 border border-green-200 rounded-md p-4 flex items-center gap-3">
                                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                                    <Check className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="font-medium text-green-800">Senha alterada com sucesso!</p>
                                    <p className="text-sm text-green-700">Sua nova senha já está ativa.</p>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleChangePassword} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="new-password">Nova Senha</Label>
                                        <Input
                                            id="new-password"
                                            type="password"
                                            value={passwords.new}
                                            onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                                            placeholder="Digite a nova senha"
                                            required
                                            minLength={6}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                                        <Input
                                            id="confirm-password"
                                            type="password"
                                            value={passwords.confirm}
                                            onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                                            placeholder="Confirme a nova senha"
                                            required
                                            minLength={6}
                                        />
                                    </div>
                                </div>
                                <Button type="submit" disabled={isLoading} className="w-full">
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Alterar Senha
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
