'use client';

import { useActionState, useState } from 'react';
import {
  addFormFieldAction,
  deleteFormFieldAction,
  type FormActionState,
} from '@/app/actions/forms';
import { SUPPORTED_FIELD_TYPES } from '@/lib/validations/forms';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { SubmitButton } from '@/components/auth/submit-button';
import { FormError } from '@/components/auth/form-error';

interface Field {
  id: string;
  label: string;
  field_type: string;
  placeholder: string | null;
  help_text: string | null;
  is_required: boolean;
  options: string[] | null;
  display_order: number;
}

interface FieldEditorProps {
  formId: string;
  fields: Field[];
}

const initialState: FormActionState = {};

export function FormFieldEditor({ formId, fields }: FieldEditorProps) {
  const addAction = addFormFieldAction.bind(null, formId);
  const [state, formAction] = useActionState(addAction, initialState);
  const [fieldType, setFieldType] = useState<string>('text');
  const needsOptions = fieldType === 'select';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Fields</CardTitle>
        <CardDescription>
          Add fields customers will fill out. Reorder by deleting and re-adding
          (drag-drop coming later).
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {fields.length > 0 && (
          <ol className="flex flex-col gap-2">
            {fields.map((f, i) => (
              <li
                key={f.id}
                className="flex items-center justify-between border border-zinc-200 rounded-md px-3 py-2"
              >
                <div>
                  <div className="font-medium text-sm text-zinc-900">
                    {i + 1}. {f.label}
                    {f.is_required && (
                      <span className="text-red-600 ml-1">*</span>
                    )}
                  </div>
                  <div className="text-xs text-zinc-500 capitalize">
                    {f.field_type}
                    {f.options && f.options.length > 0 && (
                      <span> · {f.options.length} option(s)</span>
                    )}
                  </div>
                </div>
                <form action={deleteFormFieldAction.bind(null, f.id, formId)}>
                  <Button variant="ghost" size="sm" type="submit">
                    Delete
                  </Button>
                </form>
              </li>
            ))}
          </ol>
        )}

        <form action={formAction} className="flex flex-col gap-3 border-t border-zinc-200 pt-4">
          <h3 className="text-sm font-semibold text-zinc-700">Add a field</h3>
          <FormError errors={state.errors?._form} />

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <Label htmlFor="label">Label</Label>
              <Input id="label" name="label" required placeholder="Email" />
              {state.errors?.label && (
                <p className="text-xs text-red-600">{state.errors.label[0]}</p>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="field_type">Type</Label>
              <Select
                id="field_type"
                name="field_type"
                value={fieldType}
                onChange={(e) => setFieldType(e.target.value)}
              >
                {SUPPORTED_FIELD_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="placeholder">
              Placeholder{' '}
              <span className="text-zinc-400 font-normal">(optional)</span>
            </Label>
            <Input id="placeholder" name="placeholder" />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="help_text">
              Help text{' '}
              <span className="text-zinc-400 font-normal">(optional)</span>
            </Label>
            <Input id="help_text" name="help_text" />
          </div>

          {needsOptions && (
            <div className="flex flex-col gap-1">
              <Label htmlFor="options">Options (comma-separated)</Label>
              <Input
                id="options"
                name="options"
                placeholder="First visit, Returning customer, Other"
              />
            </div>
          )}

          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input
              type="checkbox"
              name="is_required"
              className="h-4 w-4 rounded border-zinc-300"
            />
            Required
          </label>

          <SubmitButton>Add field</SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}
