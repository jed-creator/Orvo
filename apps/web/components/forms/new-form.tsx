'use client';

import { useActionState } from 'react';
import {
  createFormTemplateAction,
  type FormActionState,
} from '@/app/actions/forms';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SubmitButton } from '@/components/auth/submit-button';
import { FormError } from '@/components/auth/form-error';

const initialState: FormActionState = {};

export function NewFormForm() {
  const [state, formAction] = useActionState(
    createFormTemplateAction,
    initialState,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create a form</CardTitle>
        <CardDescription>
          Give your form a name and description. You&apos;ll add fields on the
          next screen.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <FormError errors={state.errors?._form} />
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Form name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              required
              placeholder="Health intake"
            />
            {state.errors?.name && (
              <p className="text-xs text-red-600">{state.errors.name[0]}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="description">
              Description{' '}
              <span className="text-zinc-400 font-normal">(optional)</span>
            </Label>
            <Textarea
              id="description"
              name="description"
              rows={2}
              placeholder="What this form collects"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input
              type="checkbox"
              name="is_required"
              className="h-4 w-4 rounded border-zinc-300"
            />
            Require customers to fill out this form before booking
          </label>
          <SubmitButton size="lg">Create form</SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}
