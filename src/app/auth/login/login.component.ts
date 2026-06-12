import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { UsersService } from '../../core/services/users.service';
import { SessionService } from '../../core/services/session.service';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzMessageModule, NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzCheckboxModule,
    NzMessageModule,
    NzIconModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  loginForm!: FormGroup;
  isLoading = false;
  public identity: any = null;
  public token: any = null;

  constructor(
    private fb: FormBuilder,
    private _usersService: UsersService,
    private _sessionService: SessionService,
    private router: Router,
    private message: NzMessageService
  ) {
    this.initForm();
  }

  public initForm(): void {
    this.loginForm = this.fb.group({
      usr_user: ['', [Validators.required, Validators.minLength(3)]],
      usr_password: ['', [Validators.required, Validators.minLength(6)]],
      remember: [true]
    });
  }

  public submitForm(): void {
    if (this.loginForm.valid) {
      this.isLoading = true
      const { usr_user, usr_password } = this.loginForm.value;

      // Llamamos al método login pasando el objeto y 'true' para obtener el token JWT
      this._usersService.login({ usr_user, usr_password }).subscribe({
        next: (res) => {
          this.isLoading = false;
          if (res.success && res.data) {
            this.identity = res.data;
            if (!this.identity || !this.identity.usr_uuid) {
              this.message.error('error');
            } else {
              //persist user data
              this._sessionService.setIdentity(JSON.stringify(this.identity));
              //get token
              this.getToken();
            }
          } else {
            this.message.error(res.message || 'Error desconocido al iniciar sesión');
          }
        },
        error: (err) => {
          this.isLoading = false;
          console.error(err);
          const errMsg = err.error?.error || err.error?.message || 'Error de conexión con el servidor';
          this.message.error(errMsg);
        }
      });
    } else {
      Object.values(this.loginForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }

  private getToken(): void {
    this._usersService.login(this.loginForm.value, 'true').subscribe(
      response => {
        this.token = response.data.token;
        if (this.token.length <= 0) {
          this.message.error('error');
        } else {
          //persist user token
          this._sessionService.setToken(this.token);
          // Redirigir a welcome
          this.router.navigate(['/welcome']);
        }
      },
      error => {
        let errorMessage = <any>error;
        console.log(errorMessage);
        if (errorMessage != null) {
          this.message.error(errorMessage.error.error);
        }
      }
    )
  }
}
