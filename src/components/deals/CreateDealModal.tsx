import { useState } from 'react';
import { X, Snowflake, Sun, Flame, Plus } from 'lucide-react';
import { Temperature, Tag, Deal } from '@/types/crm';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface CreateDealModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (deal: Omit<Deal, 'id' | 'createdAt'>) => void;
  phaseId: string;
  editingDeal?: Deal;
}

const temperatureOptions: { value: Temperature; label: string; icon: typeof Snowflake; className: string }[] = [
  { value: 'cold', label: 'Frio', icon: Snowflake, className: 'bg-info/10 text-info border-info hover:bg-info/20' },
  { value: 'warm', label: 'Morno', icon: Sun, className: 'bg-warning/10 text-warning border-warning hover:bg-warning/20' },
  { value: 'hot', label: 'Quente', icon: Flame, className: 'bg-destructive/10 text-destructive border-destructive hover:bg-destructive/20' },
];

const tagColors = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
];

export function CreateDealModal({ open, onClose, onSubmit, phaseId, editingDeal }: CreateDealModalProps) {
  const [title, setTitle] = useState(editingDeal?.title || '');
  const [contactName, setContactName] = useState(editingDeal?.contactName || '');
  const [document, setDocument] = useState(editingDeal?.document || '');
  const [phone, setPhone] = useState(editingDeal?.phone || '');
  const [email, setEmail] = useState(editingDeal?.email || '');
  const [value, setValue] = useState(editingDeal?.value?.toString() || '');
  const [source, setSource] = useState(editingDeal?.source || '');
  const [temperature, setTemperature] = useState<Temperature>(editingDeal?.temperature || 'cold');
  const [tags, setTags] = useState<Tag[]>(editingDeal?.tags || []);
  const [tagInput, setTagInput] = useState('');

  const handleAddTag = () => {
    if (tagInput.trim()) {
      const newTag: Tag = {
        id: Math.random().toString(36).substring(2, 9),
        name: tagInput.trim(),
        color: tagColors[Math.floor(Math.random() * tagColors.length)],
      };
      setTags([...tags, newTag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagId: string) => {
    setTags(tags.filter((t) => t.id !== tagId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmit({
      title: title.trim(),
      contactName: contactName.trim(),
      document: document.trim(),
      phone: phone.trim(),
      email: email.trim(),
      value: parseFloat(value) || 0,
      source: source.trim(),
      temperature,
      tags,
      phaseId,
    });

    resetForm();
    onClose();
  };

  const resetForm = () => {
    setTitle('');
    setContactName('');
    setDocument('');
    setPhone('');
    setEmail('');
    setValue('');
    setSource('');
    setTemperature('cold');
    setTags([]);
    setTagInput('');
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingDeal ? 'Editar Negócio' : 'Novo Negócio'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Nome do Negócio *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Venda de Software"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactName">Nome do Contato</Label>
            <Input
              id="contactName"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Ex: João Silva"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="document">CPF/CNPJ</Label>
              <Input
                id="document"
                value={document}
                onChange={(e) => setDocument(e.target.value)}
                placeholder="000.000.000-00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemplo.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="value">Valor (R$)</Label>
              <Input
                id="value"
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="0,00"
                min="0"
                step="0.01"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="source">Fonte</Label>
              <Input
                id="source"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="Ex: Site, Indicação"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Temperatura</Label>
            <div className="flex gap-2">
              {temperatureOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTemperature(option.value)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border transition-all',
                    temperature === option.value
                      ? option.className + ' border-2'
                      : 'bg-secondary/50 text-muted-foreground border-border hover:bg-secondary'
                  )}
                >
                  <option.icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Adicionar tag"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <Button type="button" variant="outline" size="icon" onClick={handleAddTag}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="tag-badge flex items-center gap-1"
                    style={{ backgroundColor: tag.color + '20', color: tag.color }}
                  >
                    {tag.name}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag.id)}
                      className="hover:opacity-70"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              {editingDeal ? 'Salvar' : 'Criar Negócio'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
