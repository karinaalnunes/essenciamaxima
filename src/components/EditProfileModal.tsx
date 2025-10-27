import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { Linkedin, Instagram, Facebook, Globe } from "lucide-react";

interface Profile {
  name: string;
  email: string;
  company?: string;
  position?: string;
  bio?: string;
  company_website?: string;
  linkedin_personal?: string;
  instagram_personal?: string;
  facebook_personal?: string;
  linkedin_company?: string;
  instagram_company?: string;
  facebook_company?: string;
  profile_visibility?: "public" | "connections_only" | "private";
}

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (profile: Profile) => void;
  profile: Profile;
}

export function EditProfileModal({ open, onClose, onSave, profile }: EditProfileModalProps) {
  const [formData, setFormData] = useState<Profile>(profile);

  useEffect(() => {
    setFormData(profile);
  }, [profile, open]);

  const handleSubmit = () => {
    onSave(formData);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Perfil</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Informações Pessoais</h3>
            
            <div>
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={formData.email}
                disabled
                className="bg-muted"
              />
            </div>

            <div>
              <Label htmlFor="position">Cargo</Label>
              <Input
                id="position"
                value={formData.position || ""}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="Ex: CEO, Gerente de Projetos"
              />
            </div>

            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio || ""}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Conte um pouco sobre você..."
                rows={3}
              />
            </div>

            <div>
              <Label>Visibilidade do Perfil</Label>
              <Select 
                value={formData.profile_visibility || "connections_only"} 
                onValueChange={(value: any) => setFormData({ ...formData, profile_visibility: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Público (todos podem ver)</SelectItem>
                  <SelectItem value="connections_only">Apenas conexões</SelectItem>
                  <SelectItem value="private">Privado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Informações da Empresa</h3>
            
            <div>
              <Label htmlFor="company">Empresa</Label>
              <Input
                id="company"
                value={formData.company || ""}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="company_website">
                <Globe className="h-4 w-4 inline mr-2" />
                Site da Empresa
              </Label>
              <Input
                id="company_website"
                value={formData.company_website || ""}
                onChange={(e) => setFormData({ ...formData, company_website: e.target.value })}
                placeholder="https://"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Redes Sociais Pessoais</h3>
            
            <div>
              <Label htmlFor="linkedin_personal">
                <Linkedin className="h-4 w-4 inline mr-2" />
                LinkedIn Pessoal
              </Label>
              <Input
                id="linkedin_personal"
                value={formData.linkedin_personal || ""}
                onChange={(e) => setFormData({ ...formData, linkedin_personal: e.target.value })}
                placeholder="https://linkedin.com/in/..."
              />
            </div>

            <div>
              <Label htmlFor="instagram_personal">
                <Instagram className="h-4 w-4 inline mr-2" />
                Instagram Pessoal
              </Label>
              <Input
                id="instagram_personal"
                value={formData.instagram_personal || ""}
                onChange={(e) => setFormData({ ...formData, instagram_personal: e.target.value })}
                placeholder="@usuario"
              />
            </div>

            <div>
              <Label htmlFor="facebook_personal">
                <Facebook className="h-4 w-4 inline mr-2" />
                Facebook Pessoal
              </Label>
              <Input
                id="facebook_personal"
                value={formData.facebook_personal || ""}
                onChange={(e) => setFormData({ ...formData, facebook_personal: e.target.value })}
                placeholder="https://facebook.com/..."
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Redes Sociais da Empresa</h3>
            
            <div>
              <Label htmlFor="linkedin_company">
                <Linkedin className="h-4 w-4 inline mr-2" />
                LinkedIn Empresarial
              </Label>
              <Input
                id="linkedin_company"
                value={formData.linkedin_company || ""}
                onChange={(e) => setFormData({ ...formData, linkedin_company: e.target.value })}
                placeholder="https://linkedin.com/company/..."
              />
            </div>

            <div>
              <Label htmlFor="instagram_company">
                <Instagram className="h-4 w-4 inline mr-2" />
                Instagram Empresarial
              </Label>
              <Input
                id="instagram_company"
                value={formData.instagram_company || ""}
                onChange={(e) => setFormData({ ...formData, instagram_company: e.target.value })}
                placeholder="@empresa"
              />
            </div>

            <div>
              <Label htmlFor="facebook_company">
                <Facebook className="h-4 w-4 inline mr-2" />
                Facebook Empresarial
              </Label>
              <Input
                id="facebook_company"
                value={formData.facebook_company || ""}
                onChange={(e) => setFormData({ ...formData, facebook_company: e.target.value })}
                placeholder="https://facebook.com/..."
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              Salvar Alterações
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
