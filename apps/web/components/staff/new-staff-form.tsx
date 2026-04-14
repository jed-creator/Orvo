'use client';

import { useActionState } from 'react';
import {
  createStaffAction,
  type StaffActionState,
} from '@/app/actions/staff';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SubmitButton } from '@/components/auth/submit-button';
import { FormError } from '@/components/auth/form-error';

const initialState: StaffActionState = {};

export function NewStaffForm() {
  const [state, formAction] = useActionState(createStaffAction, initialState);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add staff member</CardTitle>
        <CardDescription>
          Staff members provide services at your business.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <FormError errors={state.errors?._form} />
          {state.success && (
            <Alert variant="success">
              <AlertDescription>Staff member added.</AlertDescription>
            </Alert>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required />
              {state.errors?.name && (
                <p className="text-xs text-red-600">{state.errors.name[0]}</p>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="email">
                Email{' '}
                <span className="text-zinc-400 font-normal">(optional)</span>
              </Label>
              <Input id="email" name="email" type="email" />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="phone">
              Phone{' '}
              <span className="text-zinc-400 font-normal">(optional)</span>
            </Label>
            <Input id="phone" name="phone" type="tel" />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="bio">
              Bio{' '}
              <span className="text-zinc-400 font-normal">(optional)</span>
            </Label>
            <Textarea id="bio" name="bio" rows={3} />
          </div>
          <SubmitButton>Add staff member</SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}
