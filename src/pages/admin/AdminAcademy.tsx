import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useAcademy, useUpdateAcademy } from '@/hooks/useAcademy';
import { useToast } from '@/hooks/use-toast';
import { Building2, Save, Loader2, Phone, MapPin, Image } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function AdminAcademy() {
  const { toast } = useToast();
  const { data: academy, isLoading } = useAcademy();
  const updateAcademy = useUpdateAcademy();
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Initialize form when academy data loads
  const initializeForm = () => {
    if (academy) {
      setName(academy.name || '');
      setPhone(academy.phone || '');
      setAddress(academy.address || '');
      setLogoUrl(academy.logo_url || '');
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    try {
      await updateAcademy.mutateAsync({
        name: name || undefined,
        phone: phone || undefined,
        address: address || undefined,
        logo_url: logoUrl || undefined,
      });
      
      toast({
        title: 'Academia atualizada!',
        description: 'Os dados da academia foram salvos com sucesso.'
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

  const handleCancel = () => {
    if (academy) {
      setName(academy.name || '');
      setPhone(academy.phone || '');
      setAddress(academy.address || '');
      setLogoUrl(academy.logo_url || '');
    }
    setIsEditing(false);
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
            <Button onClick={initializeForm}>
              Editar Dados
            </Button>
          )}
        </div>

        {/* View Mode */}
        {!isEditing && academy && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                {academy.logo_url ? (
                  <img 
                    src={academy.logo_url} 
                    alt={academy.name}
                    className="w-16 h-16 rounded-lg object-cover border"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                    <Building2 className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <CardTitle className="text-2xl">{academy.name}</CardTitle>
                  <CardDescription>Gerenciamento da academia</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Telefone</p>
                      <p className="font-medium">{academy.phone || 'Não informado'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Endereço</p>
                      <p className="font-medium">{academy.address || 'Não informado'}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Image className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Logo</p>
                      <p className="font-medium">
                        {academy.logo_url ? 'Configurado' : 'Não configurado'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Edit Mode */}
        {isEditing && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Editar Academia
              </CardTitle>
              <CardDescription>
                Atualize as informações da sua academia
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Academia *</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Academia BJJ Central"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    placeholder="Ex: (11) 99999-9999"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  placeholder="Ex: Rua das Flores, 123 - Centro"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="logo">URL do Logo</Label>
                <Input
                  id="logo"
                  placeholder="https://exemplo.com/logo.png"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Cole a URL de uma imagem para usar como logo da academia
                </p>
              </div>
              
              {logoUrl && (
                <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                  <img 
                    src={logoUrl} 
                    alt="Preview do logo"
                    className="w-20 h-20 rounded-lg object-cover border"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <p className="text-sm text-muted-foreground">Preview do logo</p>
                </div>
              )}
              
              <Separator />
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleCancel}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSave}
                  disabled={!name || updateAcademy.isPending}
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
