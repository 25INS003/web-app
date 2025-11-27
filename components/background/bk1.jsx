import styles from './bk1.module.css';
import { useTheme } from '../../store/uiStore';

const Bk1 = () => {
    const { theme } = useTheme();
    const isDarkTheme = theme === 'dark';

    return (
        <div className={styles.wrapper}>
            <div className={isDarkTheme ? styles.container : styles.ctr} />
        </div>
    );
};

export default Bk1;