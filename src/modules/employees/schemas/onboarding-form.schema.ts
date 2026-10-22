import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OnboardingFormTemplateDocument = OnboardingFormTemplate & Document;

@Schema({ _id: false })
export class FormFieldDefinition {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true, trim: true })
  label: string;

  @Prop({ required: true, default: 'text' })
  type: string;

  @Prop({ required: true, default: false })
  required: boolean;

  @Prop({ type: [String], default: [] })
  options?: string[];

  @Prop({ required: false, default: '' })
  placeholder?: string;

  @Prop({ required: false, default: '' })
  helperText?: string;
}

export const FormFieldDefinitionSchema = SchemaFactory.createForClass(FormFieldDefinition);

@Schema({ collection: 'onboarding_form_templates', timestamps: true })
export class OnboardingFormTemplate {
  @Prop({ required: true, unique: true, index: true })
  templateId: string;

  @Prop({ required: true, index: true })
  companyId: string;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: false, index: true })
  branchId?: string;

  @Prop({ required: false, trim: true })
  branchName?: string;

  @Prop({ required: false, index: true })
  departmentId?: string;

  @Prop({ required: false, trim: true })
  departmentName?: string;

  @Prop({ required: true, default: false })
  isDefault: boolean;

  @Prop({ type: [FormFieldDefinitionSchema], default: [] })
  fields: FormFieldDefinition[];
}

export const OnboardingFormTemplateSchema = SchemaFactory.createForClass(
  OnboardingFormTemplate,
);
