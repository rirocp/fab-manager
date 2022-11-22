import { ReactNode, useEffect, useState } from 'react';
import * as React from 'react';
import _ from 'lodash';
import { usePrevious } from '../../lib/use-previous';

type tabId = string|number;

interface Tab {
  id: tabId,
  title: ReactNode,
  content: ReactNode,
  onSelected?: () => void,
}

interface FabTabsProps {
  tabs: Array<Tab>,
  defaultTab?: tabId,
  className?: string
}

/**
 * Tabulation system
 */
export const FabTabs: React.FC<FabTabsProps> = ({ tabs, defaultTab, className }) => {
  const [active, setActive] = useState<Tab>(tabs.filter(Boolean).find(t => t.id === defaultTab) || tabs.filter(Boolean)[0]);
  const previousTabs = usePrevious<Tab[]>(tabs);

  useEffect(() => {
    if (!_.isEqual(previousTabs?.filter(Boolean).map(t => t.id), tabs?.filter(Boolean).map(t => t?.id))) {
      setActive(tabs.filter(Boolean).find(t => t.id === defaultTab) || tabs.filter(Boolean)[0]);
    }
  }, [tabs]);

  /**
   * Callback triggered when a tab a selected
   */
  const onTabSelected = (tab: Tab) => {
    setActive(tab);
    if (typeof tab.onSelected === 'function') tab.onSelected();
  };

  return (
    <div className={`fab-tabs ${className || ''}`}>
      <div className="tabs">
        {tabs.filter(Boolean).map((tab, index) => (
          <p key={index} className={active?.id === tab.id ? 'is-active' : ''} onClick={() => onTabSelected(tab)}>{tab.title}</p>
        ))}
      </div>
      {active?.content}
    </div>
  );
};
