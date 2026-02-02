import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useAcademy, useUpdateAcademy } from '@/hooks/useAcademy';
import { useToast } from '@/hooks/use-toast';
import {
  Building2,
  Save,
  Loader2,
  Phone,
  MapPin,
  Image,
  Search,
  Mail,
  User,
  CreditCard,
  MessageCircle
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export default function AdminAcademy() {
  const { toast } = useToast();
  const { data: academy, isLoading } = useAcademy();
  const updateAcademy = useUpdateAcademy();

  const [isEditing, setIsEditing] = useState(false);
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [isLoadingCnpj, setIsLoadingCnpj] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    razao_social: '',
    phone: '',
    whatsapp: '',
    email: '',
    responsible_name: '',
    logo_url: '',
    // Document
    doc_type: 'cnpj', // 'cnpj' | 'cpf'
    cnpj: '',
    cpf: '',
    // Address
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
  });

  // Initialize form
  useEffect(() => {
    if (academy && !isEditing) {
      const addr = (academy as any).address_json || {};

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
      });
    }
  }, [academy, isEditing]);

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // CEP Lookup (ViaCEP)
  const handleCepLookup = async () => {
    const cep = formData.cep.replace(/\D/g, '');
    if (cep.length !== 8) {
      toast({ title: 'CEP inválido', description: 'Digite um CEP com 8 dígitos', variant: 'destructive' });
      return;
    }

    setIsLoadingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();

      if (data.erro) {
        toast({ title: 'CEP não encontrado', variant: 'destructive' });
      } else {
        setFormData(prev => ({
          ...prev,
          street: data.logradouro,
          neighborhood: data.bairro,
          city: data.localidade,
          state: data.uf,
        }));
        toast({ title: 'Endereço encontrado!' });
      }
    } catch (error) {
      toast({ title: 'Erro ao buscar CEP', variant: 'destructive' });
    } finally {
      setIsLoadingCep(false);
    }
  };

  // CNPJ Lookup (BrasilAPI)
  const handleCnpjLookup = async () => {
    const cnpj = formData.cnpj.replace(/\D/g, '');
    if (cnpj.length !== 14) {
      toast({ title: 'CNPJ inválido', description: 'Digite um CNPJ com 14 dígitos', variant: 'destructive' });
      return;
    }

    setIsLoadingCnpj(true);
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
      if (!res.ok) throw new Error('Falha ao buscar CNPJ');

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

      toast({ title: 'Dados da empresa carregados!' });
    } catch (error) {
      toast({ title: 'Erro ao buscar CNPJ', description: 'Verifique se o número está correto', variant: 'destructive' });
    } finally {
      setIsLoadingCnpj(false);
    }
  };

  const handleSave = async () => {
    try {
      // Construct address string for backward compatibility
      const fullAddress = `${formData.street}, ${formData.number}${formData.complement ? ` - ${formData.complement}` : ''} - ${formData.neighborhood}, ${formData.city} - ${formData.state}, ${formData.cep}`;

      // Construct address JSON
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
      });

      toast({
        title: 'Academia atualizada!',
        description: 'Os dados foram salvos com sucesso.'
      });
      setIsEditing(false);
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Minha Academia">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-72" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Minha Academia">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Minha Academia</h1>
            <p className="text-muted-foreground">
              Visualize e edite as informações da sua academia
            </p>
          </div>
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)}>
              Editar Dados
            </Button>
          )}
        </div>

        {/* View Mode */}
        {!isEditing && academy && (
          <div className="grid gap-6 md:grid-cols-3">
            {/* Main Info Card */}
            <Card className="md:col-span-2">
              <CardHeader>
                <div className="flex items-center gap-4">
                  {academy.logo_url ? (
                    <img
                      src={academy.logo_url}
                      alt={academy.name}
                      className="w-20 h-20 rounded-lg object-cover border"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center">
                      <Building2 className="h-10 w-10 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <CardTitle className="text-2xl">{academy.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      {(academy as any).razao_social || 'Razão Social não informada'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      {(academy as any).cpf ? 'CPF' : 'CNPJ'}
                    </p>
                    <p>{(academy as any).cpf || (academy as any).cnpj || 'Não informado'}</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Responsável
                    </p>
                    <p>{(academy as any).responsible_name || 'Não informado'}</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Telefone
                    </p>
                    <p>{academy.phone || 'Não informado'}</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      WhatsApp
                    </p>
                    <p>{(academy as any).whatsapp || 'Não informado'}</p>
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      E-mail
                    </p>
                    <p>{(academy as any).email || 'Não informado'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Address Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Endereço
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">
                  {academy.address || 'Endereço não cadastrado'}
                </p>
                {/* Map preview could go here */}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Edit Mode */}
        {isEditing && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Editar Dados da Academia
              </CardTitle>
              <CardDescription>
                Mantenha seus dados atualizados para contratos e documentos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="general">🏢 Dados Gerais</TabsTrigger>
                  <TabsTrigger value="address">📍 Endereço</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-6">
                  <RadioGroup
                    value={formData.doc_type}
                    onValueChange={(v) => updateField('doc_type', v)}
                    className="flex gap-4 mb-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="cnpj" id="r-cnpj" />
                      <Label htmlFor="r-cnpj">Pessoa Jurídica (CNPJ)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="cpf" id="r-cpf" />
                      <Label htmlFor="r-cpf">Pessoa Física (CPF)</Label>
                    </div>
                  </RadioGroup>

                  <div className="grid gap-4 md:grid-cols-2">
                    {formData.doc_type === 'cnpj' ? (
                      <div className="space-y-2">
                        <Label htmlFor="cnpj">CNPJ</Label>
                        <div className="flex gap-2">
                          <Input
                            id="cnpj"
                            placeholder="00.000.000/0000-00"
                            value={formData.cnpj}
                            onChange={(e) => updateField('cnpj', e.target.value)}
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={handleCnpjLookup}
                            disabled={isLoadingCnpj}
                            title="Buscar dados do CNPJ"
                          >
                            {isLoadingCnpj ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">Clique na lupa para preencher automaticamente.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label htmlFor="cpf">CPF</Label>
                        <Input
                          id="cpf"
                          placeholder="000.000.000-00"
                          value={formData.cpf}
                          onChange={(e) => updateField('cpf', e.target.value)}
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="razao">Razão Social / Nome Completo</Label>
                      <Input
                        id="razao"
                        value={formData.razao_social}
                        onChange={(e) => updateField('razao_social', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="name">Nome Fantasia (Nome da Academia) *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => updateField('name', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="responsible">Nome do Responsável Legal</Label>
                      <Input
                        id="responsible"
                        placeholder="Quem assina pela academia"
                        value={formData.responsible_name}
                        onChange={(e) => updateField('responsible_name', e.target.value)}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail Comercial</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => updateField('email', e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefone</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => updateField('phone', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="whatsapp">WhatsApp</Label>
                        <Input
                          id="whatsapp"
                          value={formData.whatsapp}
                          onChange={(e) => updateField('whatsapp', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="logo">URL do Logo</Label>
                    <Input
                      id="logo"
                      value={formData.logo_url}
                      onChange={(e) => updateField('logo_url', e.target.value)}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="address" className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="space-y-2 col-span-1">
                      <Label htmlFor="cep">CEP</Label>
                      <div className="flex gap-2">
                        <Input
                          id="cep"
                          placeholder="00000-000"
                          value={formData.cep}
                          onChange={(e) => updateField('cep', e.target.value)}
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={handleCepLookup}
                          disabled={isLoadingCep}
                          title="Buscar CEP"
                        >
                          {isLoadingCep ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="street">Logradouro (Rua/Av)</Label>
                      <Input
                        id="street"
                        value={formData.street}
                        onChange={(e) => updateField('street', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2 col-span-1">
                      <Label htmlFor="number">Número</Label>
                      <Input
                        id="number"
                        value={formData.number}
                        onChange={(e) => updateField('number', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="complement">Complemento</Label>
                      <Input
                        id="complement"
                        placeholder="Ap, Sala, Bloco..."
                        value={formData.complement}
                        onChange={(e) => updateField('complement', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="neighborhood">Bairro</Label>
                      <Input
                        id="neighborhood"
                        value={formData.neighborhood}
                        onChange={(e) => updateField('neighborhood', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2 col-span-3">
                      <Label htmlFor="city">Cidade</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => updateField('city', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2 col-span-1">
                      <Label htmlFor="state">Estado (UF)</Label>
                      <Input
                        id="state"
                        maxLength={2}
                        value={formData.state}
                        onChange={(e) => updateField('state', e.target.value.toUpperCase())}
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <Separator className="my-6" />

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!formData.name || updateAcademy.isPending}
                >
                  {updateAcademy.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
