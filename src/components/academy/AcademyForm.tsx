import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useAcademy, useUpdateAcademy } from '@/hooks/useAcademy';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Search, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface AcademyFormRef {
    submit: () => Promise<boolean>;
}

export const AcademyForm = forwardRef<AcademyFormRef, { onSaveSuccess?: () => void }>(({ onSaveSuccess }, ref) => {
    const { profile } = useAuth();
    const { data: academy, isLoading } = useAcademy();
    const { toast } = useToast();
    const updateAcademy = useUpdateAcademy();

    const [isLoadingCep, setIsLoadingCep] = useState(false);
    const [isLoadingCnpj, setIsLoadingCnpj] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        razao_social: '',
        phone: '',
        whatsapp: '',
        email: '',
        responsible_name: '',
        logo_url: '',
        doc_type: 'cnpj',
        cnpj: '',
        cpf: '',
        cep: '',
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
        bank_info: {
            holder_name: '',
            holder_document: '',
            bank_code: '',
            type: 'checking',
            branch: '',
            branch_digit: '',
            account: '',
            account_digit: ''
        }
    });

    useEffect(() => {
        if (academy) {
            const addr = (academy as any).address_json || {};
            const bank = (academy as any).bank_info || {};

            setFormData({
                name: academy.name || '',
                razao_social: (academy as any).razao_social || '',
                phone: academy.phone || '',
                whatsapp: (academy as any).whatsapp || '',
                email: (academy as any).email || '',
                responsible_name: (academy as any).responsible_name || '',
                logo_url: academy.logo_url || '',
                doc_type: (academy as any).cpf ? 'cpf' : 'cnpj',
                cnpj: (academy as any).cnpj || '',
                cpf: (academy as any).cpf || '',
                cep: addr.zip || '',
                street: addr.street || '',
                number: addr.number || '',
                complement: addr.complement || '',
                neighborhood: addr.neighborhood || '',
                city: addr.city || '',
                state: addr.state || '',
                bank_info: {
                    holder_name: bank.holder_name || '',
                    holder_document: bank.holder_document || '',
                    bank_code: bank.bank_code || '',
                    type: bank.type || 'checking',
                    branch: bank.branch || '',
                    branch_digit: bank.branch_digit || '',
                    account: bank.account || '',
                    account_digit: bank.account_digit || ''
                }
            });
        }
    }, [academy]);

    const handleCepLookup = async () => {
        const cep = formData.cep.replace(/\D/g, '');
        if (cep.length !== 8) return;
        setIsLoadingCep(true);
        try {
            const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await res.json();
            if (!data.erro) {
                setFormData(prev => ({
                    ...prev,
                    street: data.logradouro,
                    neighborhood: data.bairro,
                    city: data.localidade,
                    state: data.uf,
                }));
            }
        } catch (error) { } finally {
            setIsLoadingCep(false);
        }
    };

    const handleCnpjLookup = async () => {
        const cnpj = formData.cnpj.replace(/\D/g, '');
        if (cnpj.length !== 14) return;
        setIsLoadingCnpj(true);
        try {
            const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
            const data = await res.json();
            setFormData(prev => ({
                ...prev,
                razao_social: data.razao_social,
                name: data.nome_fantasia || data.razao_social,
                phone: data.ddd_telefone_1 || prev.phone,
                email: data.email || prev.email,
                cep: data.cep || prev.cep,
                street: data.logradouro || prev.street,
                number: data.numero || prev.number,
                complement: data.complemento || prev.complement,
                neighborhood: data.bairro || prev.neighborhood,
                city: data.municipio || prev.city,
                state: data.uf || prev.state,
            }));
        } catch (e) {
            toast({ title: 'Erro ao buscar CNPJ', variant: 'destructive' });
        } finally {
            setIsLoadingCnpj(false);
        }
    };

    const handleSave = async (): Promise<boolean> => {
        try {
            const fullAddress = `${formData.street}, ${formData.number} - ${formData.city}/${formData.state}`;
            const addressJson = {
                street: formData.street,
                number: formData.number,
                complement: formData.complement,
                neighborhood: formData.neighborhood,
                city: formData.city,
                state: formData.state,
                zip: formData.cep,
            };

            await updateAcademy.mutateAsync({
                name: formData.name,
                razao_social: formData.razao_social,
                phone: formData.phone,
                whatsapp: formData.whatsapp,
                email: formData.email,
                responsible_name: formData.responsible_name,
                logo_url: formData.logo_url,
                cnpj: formData.doc_type === 'cnpj' ? formData.cnpj : null,
                cpf: formData.doc_type === 'cpf' ? formData.cpf : null,
                address: fullAddress,
                address_json: addressJson,
                bank_info: formData.bank_info
            });

            toast({ title: 'Sucesso', description: 'Dados salvos com sucesso!' });
            if (onSaveSuccess) onSaveSuccess();
            return true;

        } catch (error) {
            toast({ title: 'Erro', description: 'Erro ao salvar dados. Verifique a conexão.', variant: 'destructive' });
            return false;
        }
    };

    useImperativeHandle(ref, () => ({
        submit: handleSave
    }));

    if (isLoading) return <div>Carregando...</div>;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Dados da Academia</CardTitle>
                <CardDescription>Confirme os dados cadastrais</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-6 py-4">
                    {/* Basic Info Section */}
                    <div className="space-y-4">
                        <h3 className="font-medium text-sm text-muted-foreground border-b pb-2">Dados Cadastrais</h3>

                        <div className="flex gap-4 items-center">
                            <Label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="doc_type"
                                    value="cnpj"
                                    checked={formData.doc_type === 'cnpj'}
                                    onChange={() => setFormData({ ...formData, doc_type: 'cnpj' })}
                                    className="w-4 h-4 text-primary"
                                />
                                Pessoa Jurídica (CNPJ)
                            </Label>
                            <Label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="doc_type"
                                    value="cpf"
                                    checked={formData.doc_type === 'cpf'}
                                    onChange={() => setFormData({ ...formData, doc_type: 'cpf' })}
                                    className="w-4 h-4 text-primary"
                                />
                                Pessoa Física (CPF)
                            </Label>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>{formData.doc_type === 'cnpj' ? 'CNPJ' : 'CPF'}</Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={formData.doc_type === 'cnpj' ? formData.cnpj : formData.cpf}
                                        onChange={e => setFormData({
                                            ...formData,
                                            [formData.doc_type === 'cnpj' ? 'cnpj' : 'cpf']: e.target.value
                                        })}
                                        placeholder={formData.doc_type === 'cnpj' ? "00.000.000/0000-00" : "000.000.000-00"}
                                    />
                                    {formData.doc_type === 'cnpj' && (
                                        <Button size="icon" variant="outline" onClick={handleCnpjLookup} disabled={isLoadingCnpj}>
                                            <Search className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Nome Fantasia (Nome da Academia) *</Label>
                                <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>

                            <div className="space-y-2">
                                <Label>Razão Social / Nome Completo</Label>
                                <Input value={formData.razao_social} onChange={e => setFormData({ ...formData, razao_social: e.target.value })} />
                            </div>

                            <div className="space-y-2">
                                <Label>Responsável Legal</Label>
                                <Input value={formData.responsible_name} onChange={e => setFormData({ ...formData, responsible_name: e.target.value })} />
                            </div>
                        </div>
                    </div>

                    {/* Contact Section */}
                    <div className="space-y-4">
                        <h3 className="font-medium text-sm text-muted-foreground border-b pb-2">Contato</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>E-mail</Label>
                                <Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Telefone</Label>
                                <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>WhatsApp</Label>
                                <Input value={formData.whatsapp} onChange={e => setFormData({ ...formData, whatsapp: e.target.value })} />
                            </div>
                        </div>
                    </div>

                    {/* Address Section */}
                    <div className="space-y-4">
                        <h3 className="font-medium text-sm text-muted-foreground border-b pb-2">Endereço</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="space-y-2 col-span-1">
                                <Label>CEP</Label>
                                <div className="flex gap-2">
                                    <Input value={formData.cep} onChange={e => setFormData({ ...formData, cep: e.target.value })} onBlur={handleCepLookup} />
                                    <Button size="icon" variant="outline" onClick={handleCepLookup} disabled={isLoadingCep}>
                                        <Search className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <div className="space-y-2 col-span-2">
                                <Label>Logradouro</Label>
                                <Input value={formData.street} onChange={e => setFormData({ ...formData, street: e.target.value })} />
                            </div>
                            <div className="space-y-2 col-span-1">
                                <Label>Número</Label>
                                <Input value={formData.number} onChange={e => setFormData({ ...formData, number: e.target.value })} />
                            </div>

                            <div className="space-y-2 col-span-1">
                                <Label>Complemento</Label>
                                <Input value={formData.complement} onChange={e => setFormData({ ...formData, complement: e.target.value })} />
                            </div>
                            <div className="space-y-2 col-span-1">
                                <Label>Bairro</Label>
                                <Input value={formData.neighborhood} onChange={e => setFormData({ ...formData, neighborhood: e.target.value })} />
                            </div>
                            <div className="space-y-2 col-span-1">
                                <Label>Cidade</Label>
                                <Input value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
                            </div>
                            <div className="space-y-2 col-span-1">
                                <Label>Estado (UF)</Label>
                                <Input value={formData.state} maxLength={2} onChange={e => setFormData({ ...formData, state: e.target.value.toUpperCase() })} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Dados Bancários
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Nome do Titular</Label>
                            <Input
                                value={formData.bank_info.holder_name}
                                onChange={e => setFormData({
                                    ...formData,
                                    bank_info: { ...formData.bank_info, holder_name: e.target.value }
                                })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>CPF/CNPJ do Titular</Label>
                            <Input
                                value={formData.bank_info.holder_document}
                                onChange={e => setFormData({
                                    ...formData,
                                    bank_info: { ...formData.bank_info, holder_document: e.target.value }
                                })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="space-y-2">
                            <Label>Banco</Label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={formData.bank_info.bank_code}
                                onChange={e => setFormData({
                                    ...formData,
                                    bank_info: { ...formData.bank_info, bank_code: e.target.value }
                                })}
                            >
                                <option value="">Selecione um banco...</option>
                                <option value="001">001 - Banco do Brasil</option>
                                <option value="104">104 - Caixa Econômica Federal</option>
                                <option value="033">033 - Santander</option>
                                <option value="237">237 - Bradesco</option>
                                <option value="341">341 - Itaú</option>
                                <option value="260">260 - Nubank</option>
                                <option value="077">077 - Inter</option>
                                <option value="212">212 - Banco Original</option>
                                <option value="655">655 - Banco Votorantim</option>
                                <option value="422">422 - Banco Safra</option>
                                <option value="748">748 - Sicredi</option>
                                <option value="756">756 - Sicoob</option>
                                <option value="197">197 - Stone Pagamentos</option>
                                <option value="290">290 - PagSeguro</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label>Tipo de Conta</Label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={formData.bank_info.type}
                                onChange={e => setFormData({
                                    ...formData,
                                    bank_info: { ...formData.bank_info, type: e.target.value }
                                })}
                            >
                                <option value="checking">Conta Corrente</option>
                                <option value="savings">Conta Poupança</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 mt-4">
                        <div className="space-y-2 col-span-1">
                            <Label>Agência</Label>
                            <Input
                                value={formData.bank_info.branch}
                                onChange={e => setFormData({
                                    ...formData,
                                    bank_info: { ...formData.bank_info, branch: e.target.value }
                                })}
                            />
                        </div>
                        <div className="space-y-2 col-span-1">
                            <Label>Dígito</Label>
                            <Input
                                value={formData.bank_info.branch_digit}
                                onChange={e => setFormData({
                                    ...formData,
                                    bank_info: { ...formData.bank_info, branch_digit: e.target.value }
                                })}
                            />
                        </div>
                        <div className="space-y-2 col-span-1">
                            <Label>Conta</Label>
                            <Input
                                value={formData.bank_info.account}
                                onChange={e => setFormData({
                                    ...formData,
                                    bank_info: { ...formData.bank_info, account: e.target.value }
                                })}
                            />
                        </div>
                        <div className="space-y-2 col-span-1">
                            <Label>Dígito</Label>
                            <Input
                                value={formData.bank_info.account_digit}
                                onChange={e => setFormData({
                                    ...formData,
                                    bank_info: { ...formData.bank_info, account_digit: e.target.value }
                                })}
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <Button onClick={() => handleSave()}>Salvar Alterações</Button>
                </div>
            </CardContent>
        </Card>
    );
});
AcademyForm.displayName = 'AcademyForm';
