export class User {

  id: number;

  password: string;

  isAdmin: boolean;

  authorities: Authority[];

  sub: string;
  birthdate: Date | null;
  address: string;
  familyName: string;
  gender: string;
  givenName: string;
  locale: string;
  email: string;
  emailVerified: boolean;
  username: string;

  insurance: string;
  zipcode: string;

  displayName(): string {
    return `${this.username} ${this.isAdmin ? '(Admin)' : ''}`;
  }


}

export interface Authority {

  authority: string;

}
