import styles from './dependeny-container.module.scss';
import React from 'react';

type DependencyContainerProps = {
  name: string;
  dependencies: any;
}

export const DependencyContainer: React.FC<DependencyContainerProps> = ({ name, dependencies }) => {
  const isInSync = true;
  return (
    <div className={`${styles.dependenyContainer} ${isInSync ? styles.inSync : styles.outOfSync}`}>
      <h3>{name}</h3>
      <h3>Dependencies</h3>
      <ul>{dependencies.map(dependency => <li key={dependency[0]}>{dependency[0]}</li>)}</ul>
    </div>
  )
}
