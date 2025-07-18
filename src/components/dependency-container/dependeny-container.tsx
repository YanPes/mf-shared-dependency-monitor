import styles from './dependeny-container.module.scss';

type DependencyContainerProps = {
    name: string;
}

export const DependencyContainer = ({name}: DependencyContainerProps) => {
    const isInSync = true;
    return(
        <div className={`${styles.dependenyContainer} ${isInSync ? styles.inSync : styles.outOfSync}`}>
            {name}
        </div>
    )
}