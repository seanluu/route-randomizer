import DistanceSelector from '@/components/DistanceSelector';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

describe('DistanceSelector', () => {
  it('calls onDistanceChange when a distance is selected', () => {
    const onChange = jest.fn();
    const { getByText } = render(
      <DistanceSelector selectedDistance={1609} onDistanceChange={onChange} units="imperial" />
    );

    const oneMile = getByText(/1 mi/i);
    fireEvent.press(oneMile);
    expect(onChange).toHaveBeenCalled();
  });
});


