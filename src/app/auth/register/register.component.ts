import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { UsersService } from '../../core/services/users.service';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzMessageModule, NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzMessageModule,
    NzIconModule
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  registerForm!: FormGroup;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private _usersService: UsersService,
    private router: Router,
    private message: NzMessageService
  ) {
    this.initForm();
  }

  public initForm(): void {
    this.registerForm = this.fb.group({
      usr_name: ['', [Validators.required, Validators.minLength(2)]],
      usr_surname: ['', [Validators.required, Validators.minLength(2)]],
      usr_nick: ['', [Validators.required, Validators.minLength(3)]],
      usr_email: ['', [Validators.required, Validators.email]],
      usr_password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  public submitForm(): void {
    if (this.registerForm.valid) {
      this.isLoading = true;
      
      // La API espera un objeto con las propiedades del usuario.
      // Se utiliza el método singup (con esa ortografía exacta del servicio)
      this._usersService.singup(this.registerForm.value).subscribe({
        next: (res) => {
          this.isLoading = false;
          // El backend retorna { user } o mensaje de éxito
          this.message.success('Usuario registrado con éxito. Se envió un correo de confirmación.');
          this.router.navigate(['/auth/login']);
        },
        error: (err) => {
          this.isLoading = false;
          console.error(err);
          const errMsg = err.error?.error || err.error?.message || 'Error al registrar el usuario';
          this.message.error(errMsg);
        }
      });
    } else {
      Object.values(this.registerForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }
}
