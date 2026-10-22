import { Document } from 'mongoose';
export type OnboardingFormTemplateDocument = OnboardingFormTemplate & Document;
export declare class FormFieldDefinition {
    id: string;
    label: string;
    type: string;
    required: boolean;
    options?: string[];
    placeholder?: string;
    helperText?: string;
}
export declare const FormFieldDefinitionSchema: import("mongoose").Schema<FormFieldDefinition, import("mongoose").Model<FormFieldDefinition, any, any, any, Document<unknown, any, FormFieldDefinition, any, {}> & FormFieldDefinition & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, FormFieldDefinition, Document<unknown, {}, import("mongoose").FlatRecord<FormFieldDefinition>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<FormFieldDefinition> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
export declare class OnboardingFormTemplate {
    templateId: string;
    companyId: string;
    title: string;
    branchId?: string;
    branchName?: string;
    departmentId?: string;
    departmentName?: string;
    isDefault: boolean;
    fields: FormFieldDefinition[];
}
export declare const OnboardingFormTemplateSchema: import("mongoose").Schema<OnboardingFormTemplate, import("mongoose").Model<OnboardingFormTemplate, any, any, any, Document<unknown, any, OnboardingFormTemplate, any, {}> & OnboardingFormTemplate & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, OnboardingFormTemplate, Document<unknown, {}, import("mongoose").FlatRecord<OnboardingFormTemplate>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<OnboardingFormTemplate> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
