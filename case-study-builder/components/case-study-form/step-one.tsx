import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card } from '@/components/ui/card';
import { CaseStudyFormData } from '@/app/dashboard/new/page';
import { Star, Cpu, FileText } from 'lucide-react';

type Props = {
  formData: CaseStudyFormData;
  updateFormData: (data: Partial<CaseStudyFormData>) => void;
};

export default function StepOne({ formData, updateFormData }: Props) {
  const caseTypes = [
    {
      value: 'APPLICATION',
      label: 'Application Case Study',
      description: 'Quick capture of a solved industrial challenge.',
      points: 1,
      icon: FileText,
      color: 'text-wa-green-600',
      bgColor: 'bg-wa-green-50',
      borderColor: 'border-wa-green-200',
    },
    {
      value: 'TECH',
      label: 'Tech Case Study',
      description: 'Quick capture of a solved industrial challenge + WPS (Welding Procedure Specification).',
      points: 2,
      icon: Cpu,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
    },
    {
      value: 'STAR',
      label: 'Star Case Study',
      description: 'Quick capture of a solved industrial challenge + financial impact of the solution. Optional WPS adds +1 bonus point.',
      points: '3-4',
      icon: Star,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
    },
  ];

  return (
    <div className="space-y-6">
      <RadioGroup
        value={formData.type}
        onValueChange={(value) =>
          updateFormData({ type: value as 'APPLICATION' | 'TECH' | 'STAR' })
        }
        className="space-y-4"
      >
        {caseTypes.map((type) => {
          const Icon = type.icon;
          const isSelected = formData.type === type.value;

          return (
            <Card role="article"
              key={type.value}
              className={`relative cursor-pointer transition-all dark:bg-card dark:border-border ${
                isSelected
                  ? `${type.borderColor} border-2 ${type.bgColor} dark:border-primary dark:bg-accent`
                  : 'border hover:border-gray-300 dark:hover:border-primary/50'
              }`}
              onClick={() =>
                updateFormData({ type: type.value as 'APPLICATION' | 'TECH' | 'STAR' })
              }
            >
              <div className="flex items-start gap-4 p-6">
                <RadioGroupItem value={type.value} id={type.value} className="mt-1" />
                <div className={`p-3 rounded-lg ${type.bgColor}`}>
                  <Icon className={`h-6 w-6 ${type.color}`} />
                </div>
                <div className="flex-1">
                  <Label
                    htmlFor={type.value}
                    className="text-lg font-semibold cursor-pointer dark:text-foreground"
                  >
                    {type.label}
                  </Label>
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground mt-1">{type.description}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <span className={`text-sm font-bold ${type.color}`}>
                      +{type.points} Point{typeof type.points === 'number' && type.points === 1 ? '' : 's'}
                    </span>
                    <span className="text-xs text-muted-foreground dark:text-muted-foreground">
                      • {type.value === 'APPLICATION' && '~2 min'}
                      {type.value === 'TECH' && '~5 min'}
                      {type.value === 'STAR' && '~10 min'}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </RadioGroup>
    </div>
  );
}
