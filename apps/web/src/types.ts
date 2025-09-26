export type Client = { id:number; name:string; cpf:string; matricula:string; orgao?:string; telefone_preferencial?:string; };
export type Case = { id:number; status:string; assigned_user_id?:number|null; client: Client; };
export type CaseDetail = { id:number; status:string; client: Client; };
