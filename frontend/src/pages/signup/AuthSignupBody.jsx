import styles from './css/AuthSignupBody.module.css';
import { Link } from 'react-router-dom';
export const AuthSignupBody = () => {
  return (
    <section className={styles.authContainer}>
      <div>
        <form className={styles.authForm}>
          <h1 className={styles.authTiltle}>create account</h1>
          <div className={styles.authFormInputContainer}>
            <label htmlFor='firstname'>First Name</label>
            <input
              type='text'
              placeholder='First Name'
              className={styles.authFormInput}
            />
          </div>
          <div className={styles.authFormInputContainer}>
            <label htmlFor='Last Name'>Last Name</label>
            <input
              type='text'
              placeholder='Last Name'
              className={styles.authFormInput}
            />
          </div>
          <div className={styles.authFormInputContainer}>
            <label htmlFor='email'>Email</label>
            <input
              type='email'
              placeholder='Email'
              className={styles.authFormInput}
            />
          </div>

          <div className={styles.authFormInputContainer}>
            <label htmlFor='password'>Password</label>
            <input
              type='password'
              placeholder='Password'
              className={styles.authFormInput}
            />
          </div>

          <button onClick={() => navigate('/')} className={styles.registerBtn}>
            sign in
          </button>
        </form>
      </div>
    </section>
  );
};
