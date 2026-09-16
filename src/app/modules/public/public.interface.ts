export enum PolicyTypeEnum {
    TERMS_AND_CONDITIONS = "terms-and-conditions",
    PRIVACY_POLICY = "privacy-policy",
}

export interface IPolicy {
    type: PolicyTypeEnum;
    title: string;
    content: string;
    publishedAt?: Date;
    isDeleted: boolean;
}
